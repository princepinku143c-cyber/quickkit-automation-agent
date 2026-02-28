
import { Blueprint, NexusType, NexusSubtype } from '../types';

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'bp-linkedin-form',
    title: 'LinkedIn Viral Post Form',
    description: 'A public form that collects a Topic and Tone, generates a post using AI, and emails you the result. (Try the Public Form!)',
    category: 'Simple Start',
    nexuses: [
      {
        id: 'trigger',
        type: NexusType.TRIGGER,
        subtype: NexusSubtype.WEBHOOK,
        label: 'Content Request Form',
        position: { x: 100, y: 250 },
        config: { 
            webhookMethod: 'POST',
            formFields: [
                { id: 'f1', label: 'Topic', type: 'text', placeholder: 'e.g. Remote Work Leadership' },
                { id: 'f2', label: 'Tone', type: 'text', placeholder: 'e.g. Professional yet witty' },
                { id: 'f3', label: 'User Email', type: 'email', placeholder: 'name@company.com' }
            ]
        },
        outputs: ['default']
      },
      {
        id: 'ai_generator',
        type: NexusType.ACTION,
        subtype: NexusSubtype.AGENT,
        label: 'AI Post Writer',
        position: { x: 500, y: 250 },
        config: {
          systemMessage: "You are a LinkedIn viral ghostwriter. Write a post about {{Content_Request_Form.data.topic}} with a {{Content_Request_Form.data.tone}} tone.",
          model: 'gemini-3-flash-preview'
        },
        outputs: ['default']
      },
      {
        id: 'email_result',
        type: NexusType.ACTION,
        subtype: NexusSubtype.EMAIL,
        label: 'Send Draft via Email',
        position: { x: 900, y: 250 },
        config: {
          recipient: '{{Content_Request_Form.data.user_email}}',
          subject: 'Your LinkedIn Draft: {{Content_Request_Form.data.topic}}',
          content: 'Here is your generated post:\n\n{{AI_Post_Writer.data.text}}'
        },
        outputs: ['default']
      }
    ],
    synapses: [
      { id: 's1', sourceId: 'trigger', targetId: 'ai_generator', sourceHandle: 'default' },
      { id: 's2', sourceId: 'ai_generator', targetId: 'email_result', sourceHandle: 'default' }
    ]
  },
  {
    id: 'bp-1',
    title: 'AI Content Generator',
    description: 'Automatically generate SEO-optimized blog posts from a topic and email the draft.',
    category: 'AI',
    nexuses: [
      {
        id: 'n1',
        type: NexusType.TRIGGER,
        subtype: NexusSubtype.WEBHOOK,
        label: 'Start Trigger',
        position: { x: 100, y: 300 },
        config: { webhookMethod: 'POST' },
        outputs: ['default']
      },
      {
        id: 'n2',
        type: NexusType.ACTION,
        subtype: NexusSubtype.AGENT,
        label: 'AI Writer',
        position: { x: 500, y: 300 },
        config: {
          systemMessage: "You are an expert SEO content writer. Write a 300-word blog post about the topic provided in the input.",
          model: 'gemini-3-flash-preview',
          enabledTools: ['web_search']
        },
        outputs: ['default']
      },
      {
        id: 'n3',
        type: NexusType.ACTION,
        subtype: NexusSubtype.EMAIL,
        label: 'Email Draft',
        position: { x: 900, y: 300 },
        config: {
          subject: 'New Blog Post Draft',
          content: 'Here is your generated content:\n\n{{AI_Writer.data.text}}'
        },
        outputs: ['default']
      }
    ],
    synapses: [
      { id: 's1', sourceId: 'n1', targetId: 'n2', sourceHandle: 'default' },
      { id: 's2', sourceId: 'n2', targetId: 'n3', sourceHandle: 'default' }
    ]
  },
  {
    id: 'bp-releasebot',
    title: 'ReleaseBot (DevOps)',
    description: 'Automate release notes. Fetches Jira tickets, summarizes with AI, pushes to GitHub, and notifies Slack.',
    category: 'Dev / Ops',
    nexuses: [
      {
        id: 'trigger',
        type: NexusType.TRIGGER,
        subtype: NexusSubtype.WEBHOOK,
        label: 'Release Trigger',
        position: { x: 100, y: 250 },
        config: { webhookMethod: 'POST' },
        outputs: ['default']
      },
      {
        id: 'jira',
        type: NexusType.ACTION,
        subtype: NexusSubtype.JIRA,
        label: 'Fetch Tickets',
        position: { x: 400, y: 250 },
        config: { resource: 'issue', operation: 'get', jql: 'project = PROJ AND status = Done' },
        outputs: ['default']
      },
      {
        id: 'ai_summarizer',
        type: NexusType.ACTION,
        subtype: NexusSubtype.AGENT,
        label: 'Release Notes AI',
        position: { x: 700, y: 250 },
        config: { 
            systemMessage: "Summarize these Jira tickets into a clean Release Note markdown format.",
            model: 'gemini-3-flash-preview'
        },
        outputs: ['default']
      },
      {
        id: 'github',
        type: NexusType.ACTION,
        subtype: NexusSubtype.GITHUB,
        label: 'Create Release',
        position: { x: 1000, y: 150 },
        config: { resource: 'release', operation: 'create', repo: 'my-org/my-repo', body: '{{Release_Notes_AI.data.text}}' },
        outputs: ['default']
      },
      {
        id: 'slack',
        type: NexusType.ACTION,
        subtype: NexusSubtype.SLACK,
        label: 'Notify Team',
        position: { x: 1000, y: 350 },
        config: { channel: '#releases', message: '🚀 New Release Created!\n\n{{Release_Notes_AI.data.text}}' },
        outputs: ['default']
      }
    ],
    synapses: [
      { id: 's1', sourceId: 'trigger', targetId: 'jira', sourceHandle: 'default' },
      { id: 's2', sourceId: 'jira', targetId: 'ai_summarizer', sourceHandle: 'default' },
      { id: 's3', sourceId: 'ai_summarizer', targetId: 'github', sourceHandle: 'default' },
      { id: 's4', sourceId: 'ai_summarizer', targetId: 'slack', sourceHandle: 'default' }
    ]
  }
];
