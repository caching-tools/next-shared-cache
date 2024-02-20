#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

import 'dotenv/config';
import { OpenAI } from 'openai';

// OpenAI client initialization
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60 * 1000,
});

// Readline interface initialization
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Constants for configurations
const DEFAULT_MODEL = 'gpt-4-1106-preview';
const SUPPORTED_MODELS = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-1106-preview'];
const DEFAULT_TEMPERATURE = 0.05;
const COMMIT_LENGTH_MIN = 50;
const COMMIT_LENGTH_MAX = 500;

// Argument parsing function
function parseArguments(args: string[]): Record<string, string> {
    return args.reduce<Record<string, string>>((acc, arg) => {
        const [keyWithDash, value] = arg.split('=');

        if (keyWithDash?.startsWith('--') && value) {
            const key = keyWithDash.slice(2);

            acc[key] = value;
        }
        return acc;
    }, {});
}

// Extract and set defaults
const args = parseArguments(process.argv.slice(2));
const {
    model = DEFAULT_MODEL,
    modelTemperature = `${DEFAULT_TEMPERATURE}`,
    commitLength = `${COMMIT_LENGTH_MIN}`,
} = args;

// Validations
const commitLengthNumber = Number.parseInt(commitLength, 10);
if (
    Number.isNaN(commitLengthNumber) ||
    commitLengthNumber < COMMIT_LENGTH_MIN ||
    commitLengthNumber > COMMIT_LENGTH_MAX
) {
    throw new Error(`Invalid commit length ${commitLength}`);
}

const temperature = Number.parseFloat(modelTemperature);
if (Number.isNaN(temperature)) {
    throw new Error(`Invalid temperature ${modelTemperature}`);
}

if (!SUPPORTED_MODELS.includes(model)) {
    // typecast required because of TS's strict type checking with array includes
    throw new Error(`Model ${model} is not supported`);
}

// Utility functions
async function getUserPrompt(question: string): Promise<string> {
    const answer = await rl.question(`\n${question}\n\nAnswer: `);
    return answer;
}

async function main(): Promise<void> {
    const diffBuffer = execFileSync('git', ['diff', '--cached', '--stat']);

    const diff = diffBuffer.toString('utf-8').trim();

    const statusBuffer = execFileSync('git', ['status', '--renames']);

    const status = statusBuffer.toString('utf-8').trim();

    const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: `
            Context:
            You are an assistant tasked with creating commit messages for the user working on JavaScript or TypeScript projects.
            Inputs:
            You will receive the Git status and Git diffstat.
            Guidelines:
            Using the Git status, identify which files have been affected and the branch name.
            Using the Git diffstat, identify files and directories with significant changes.
            If the most significant change is a package-lock.json file, ignore it.
            Try to understand then tell what the user tries to achieve with this commit. Be explicit.
            Ask the user to correct you. Keep asking until you have a good understanding.
            Use all your information and context to determine what the user is trying to achieve.
            Based on this information, create a short commit message in an imperative style. E.g., "Update...", "Refactor...", or "Fix..." etc.
            Try to keep it under ${commitLengthNumber} characters.
            If the message length exceeds ${commitLengthNumber} characters, use markdown syntax to break it into multiple paragraphs.
        `.trim(),
        },
        {
            role: 'system',
            content: `Git status:
            ${status}`.trim(),
        },
        {
            role: 'system',
            content: `Git diffstat:
            ${diff}`.trim(),
        },
    ];

    const functions: OpenAI.ChatCompletionCreateParams.Function[] = [
        {
            name: 'getUserPrompt',
            parameters: {
                type: 'object',
                properties: {
                    question: {
                        type: 'string',
                        description: 'Question to prompt the user with.',
                    },
                },
                required: ['question'],
            },
            description: 'Ask the user to correct',
        },
    ];

    const response = await openai.chat.completions.create({
        messages,
        model,
        temperature,
        functions,
    });

    let conversationChoice: OpenAI.Chat.Completions.ChatCompletion.Choice;

    const initialChoice = response.choices.at(0);

    if (!initialChoice) {
        throw new Error('No conversation choice');
    }

    conversationChoice = initialChoice;

    while (conversationChoice.finish_reason === 'function_call') {
        const conversationMessage = conversationChoice.message;

        if (conversationMessage.function_call) {
            const availableFunctions: Record<string, (question: string) => Promise<string>> = {
                getUserPrompt,
            };
            const functionName = conversationMessage.function_call.name;
            const functionToCall = availableFunctions[functionName];

            if (!functionToCall) {
                throw new Error(`Function ${functionName} is not available`);
            }

            const functionArgs = JSON.parse(conversationMessage.function_call.arguments) as unknown as {
                question: string;
            };

            const functionResponse = await functionToCall(functionArgs.question);

            messages.push(conversationMessage);

            messages.push({
                role: 'function',
                name: functionName,
                content: functionResponse,
            });

            const nextResponse = await openai.chat.completions.create({
                messages,
                model,
                temperature,
                functions,
            });

            const nextChoice = nextResponse.choices.at(0);

            if (!nextChoice) {
                throw new Error('No conversation choice');
            }

            conversationChoice = nextChoice;
        }
    }

    process.stdout.write(`\n${conversationChoice.message.content ?? ''}`);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch(() => {
        process.exit(1);
    });
