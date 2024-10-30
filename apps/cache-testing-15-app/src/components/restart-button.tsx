'use client';

import { type JSX, useState } from 'react';

export function RestartButton(): JSX.Element {
    const [restartState, setRestartState] = useState('');

    function restart(): void {
        fetch('/api/restart-app').then((result) => {
            if (!result.ok) {
                setRestartState('Fail to restart');
            }
        });

        setRestartState('Restarting...');
    }

    return (
        <div>
            <button data-pw="restart-button" onClick={restart} type="button">
                Restart app
            </button>
            <div data-pw="restart-state">{restartState}</div>
        </div>
    );
}
