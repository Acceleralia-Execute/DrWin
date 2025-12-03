/**
 * Tipos para el sistema de agente
 */

export interface AgentMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp?: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

export interface AgentContext {
  conversationHistory: AgentMessage[];
  currentWorkflow?: string;
  collectedData?: Record<string, any>;
}

export interface SearchOpportunitiesParams {
  keywords: string[];
  fundingTypes?: {
    nationalSubsidies?: boolean;
    internationalSubsidies?: boolean;
    nationalTenders?: boolean;
    internationalTenders?: boolean;
  };
  startDate?: string;
  endDate?: string;
  language?: 'es' | 'ca' | 'en' | 'fr' | 'de' | 'it';
}

export interface ValidateGrantParams {
  grantUrl: string;
  companyProfile?: {
    name?: string;
    businessSummary?: string;
    sector?: string;
    services?: string[];
    keywords?: string[];
  };
  projectDetails?: {
    title?: string;
    description?: string;
    objectives?: string[];
  };
}

export interface GenerateConceptParams {
  grantContext: string;
  companyProfile: {
    name: string;
    businessSummary: string;
    sector: string;
  };
  projectIdea?: string;
  mandatoryConditionsFile?: string; // base64 PDF
}

export interface AdaptProposalParams {
  originalProposal: string; // base64 PDF/DOCX
  feedbackFile?: string; // base64 PDF/DOCX
  newCallFile?: string; // base64 PDF/DOCX
  newCallLink?: string;
}

export interface CompareGrantsParams {
  grantUrls: string[];
  criteria?: string[];
}

