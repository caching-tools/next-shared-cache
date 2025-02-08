import type { MetaRecord } from 'nextra';

const meta: MetaRecord = {
  '-- Getting Started': {
    type: 'separator',
    title: 'Getting Started',
  },
  index: 'Introduction',
  installation: 'Installation and the First Steps',
  usage: 'Usage guides',
  '-- Examples': {
    type: 'separator',
    title: 'Examples',
  },
  redis: 'Built-in Redis Handler',
  'cluster-example': {
    title: 'Redis Cluster example',
    href: 'https://github.com/mauroaccornero/cache-handler-redis-cluster-example',
  },
  'k8s-example': {
    title: 'Kubernetes example',
    href: 'https://github.com/ezeparziale/nextjs-k8s',
  },
  '-- API Reference': {
    type: 'separator',
    title: 'API Reference',
  },
  'api-reference': 'Handlers API',
  handlers: 'Built-in Handlers',
  functions: 'Functions',
  '-- Troubleshooting': {
    type: 'separator',
    title: 'Troubleshooting',
  },
  troubleshooting: 'Troubleshooting',
  '-- More': {
    type: 'separator',
    title: 'More',
  },
  'official-example': {
    title: 'Official Next.js template',
    href: 'https://github.com/vercel/next.js/tree/canary/examples/cache-handler-redis',
  },
  'next.js-link': {
    title: 'Next.js Configuring caching Docs',
    href: 'https://nextjs.org/docs/app/building-your-application/deploying#configuring-caching',
  },
};

export default meta;
