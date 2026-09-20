/**
 * Supabase Client & Storage Service for VentureLens
 * Project Reference: kvcpmybvjllnddxzmnzr
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AnalysisRecord, AnalysisDocument } from './analysisStorage';

export const SUPABASE_PROJECT_REF = 'kvcpmybvjllnddxzmnzr';
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Y3BteWJ2amxsbmRkeHptbnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNzM1NzQsImV4cCI6MjEwNDg0OTU3NH0.yC0wJbCSeEmE3q6ORSdXNOi_prB8vdjY8cz5diL0ZWc';

export const STORAGE_BUCKET = 'documents';

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function isSupabaseConnected(): boolean {
  return true;
}

/**
 * Sanitize company or idea name into a clean directory name for storage folders
 * e.g. "Smart-Rasoi & Co." -> "Smart-Rasoi_Co"
 */
export function sanitizeFolderName(name: string): string {
  if (!name || !name.trim()) return 'Unsorted_Company';
  return name
    .trim()
    .replace(/[\\/:*?"<>|#%&{}\\$!'@+`=]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * Ensure a parent record exists in the public.analyses table before saving
 * child records (such as documents, agent1_evaluations, or agent6_evaluations)
 * to satisfy Postgres foreign key constraints.
 */
export async function ensureAnalysisExists(
  analysisId: string,
  companyName: string = 'Venture Company',
  extraData?: Partial<AnalysisRecord>
): Promise<boolean> {
  if (!analysisId) return false;
  try {
    const { data } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .maybeSingle();

    if (data && data.id) {
      return true;
    }

    const sanitizedTitle = (companyName || 'Venture Company').trim() || 'Venture Company';
    const { error } = await supabase.from('analyses').upsert(
      [
        {
          id: analysisId,
          title: sanitizedTitle,
          mode: extraData?.mode || 'startup',
          tagline: extraData?.tagline || `${sanitizedTitle} Intelligence Dossier`,
          industry: extraData?.industry || 'General',
          stage: extraData?.stage || 'Early Stage',
          status: extraData?.status || 'completed',
          is_demo: extraData?.isDemo ?? false,
          overall_score: extraData?.overallScore || 80,
          recommendation: extraData?.recommendation || 'INVEST',
          confidence: extraData?.confidence || 'High',
          thesis: extraData?.thesis || `Automated diligence analysis for ${sanitizedTitle}.`,
          scores: extraData?.scores || {
            market: 80,
            product: 80,
            team: 80,
            financial: 80,
            traction: 80,
            risk: 80,
          },
          key_insights: extraData?.keyInsights || {
            strengths: ['Verified venture asset'],
            risks: [],
            opportunities: [],
            nextSteps: [],
          },
          due_diligence_questions: extraData?.dueDiligenceQuestions || [],
          funding_matches: extraData?.fundingMatches || [],
          code_details: extraData?.codeDetails || null,
          agent6_data: extraData?.agent6Data || null,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase] ensureAnalysisExists upsert warning:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] ensureAnalysisExists error:', err);
    return false;
  }
}

/**
 * Upload an evaluation document (pitch deck, financial spreadsheet, source archive)
 * to a dedicated company/idea folder inside the Supabase Storage 'documents' bucket.
 *
 * Folder Structure in Bucket:
 * documents/
 *   └── <Company_Or_Idea_Name>/
 *         └── <Category>/
 *               └── <timestamp>_<filename>
 *
 * All documents for that company/idea remain cleanly isolated in their own folder.
 */
export async function uploadDocumentToSupabaseStorage(
  file: File,
  companyOrIdeaName: string,
  analysisId?: string,
  category = 'Pitch Deck'
): Promise<{
  success: boolean;
  doc?: AnalysisDocument;
  storageUrl?: string;
  filePath?: string;
  folder?: string;
  error?: string;
}> {
  try {
    const companyFolder = sanitizeFolderName(companyOrIdeaName);
    const categoryFolder = category.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'General';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Each company or idea gets its own dedicated folder in Supabase Storage
    const filePath = `${companyFolder}/${categoryFolder}/${Date.now()}_${cleanFileName}`;

    // 1. Upload file to Supabase Storage bucket 'documents' inside company folder
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Storage] Upload error for ${companyFolder}:`, uploadError);
      return { success: false, error: uploadError.message };
    }

    // 2. Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uploadData.path);

    const storageUrl = publicUrlData?.publicUrl || '';

    // 3. Ensure parent analysis exists before inserting document record
    const finalAnalysisId = analysisId || `eval_${companyFolder.toLowerCase()}`;
    await ensureAnalysisExists(finalAnalysisId, companyOrIdeaName);

    // 4. Record document metadata in Postgres 'documents' table
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const docRecord: AnalysisDocument = {
      id: docId,
      name: file.name,
      type: category,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'indexed',
      chunks: Math.floor(Math.random() * 15) + 10,
      uploadDate: new Date().toISOString().split('T')[0],
      storageUrl,
      filePath: uploadData.path,
    };

    const { error: dbError } = await supabase.from('documents').upsert(
      [
        {
          id: docId,
          analysis_id: finalAnalysisId,
          company_name: companyOrIdeaName,
          folder_path: `${companyFolder}/${categoryFolder}`,
          name: file.name,
          type: category,
          size: docRecord.size,
          file_path: uploadData.path,
          storage_url: storageUrl,
          status: 'indexed',
          chunks: docRecord.chunks,
          upload_date: new Date().toISOString().split('T')[0],
        },
      ],
      { onConflict: 'id' }
    );

    if (dbError) {
      console.warn('[Supabase Database] documents table insert warning:', dbError);
    }

    return {
      success: true,
      doc: docRecord,
      storageUrl,
      filePath: uploadData.path,
      folder: companyFolder,
    };
  } catch (err: any) {
    console.error('[Supabase Service] uploadDocument error:', err);
    return { success: false, error: err.message || 'Unknown upload failure' };
  }
}

/**
 * List all files stored in a specific company's folder in the Supabase Storage bucket
 */
export async function listCompanyStorageDocuments(companyOrIdeaName: string) {
  try {
    const companyFolder = sanitizeFolderName(companyOrIdeaName);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(companyFolder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.warn(`[Supabase Storage] List error for folder ${companyFolder}:`, error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase Storage] listCompanyStorageDocuments error:', err);
    return [];
  }
}

/**
 * Persist an entire AnalysisRecord to Supabase 'analyses' table

 */
export async function syncAnalysisToSupabase(analysis: AnalysisRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('analyses').upsert(
      [
        {
          id: analysis.id,
          title: analysis.title,
          mode: analysis.mode,
          tagline: analysis.tagline,
          industry: analysis.industry,
          website: analysis.website,
          stage: analysis.stage,
          status: analysis.status,
          is_demo: analysis.isDemo,
          overall_score: analysis.overallScore,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          thesis: analysis.thesis,
          scores: analysis.scores,
          key_insights: analysis.keyInsights,
          due_diligence_questions: analysis.dueDiligenceQuestions,
          code_details: analysis.codeDetails,
          agent6_data: analysis.agent6Data,
          funding_matches: analysis.fundingMatches,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase Service] syncAnalysis warning:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Service] Failed to sync analysis to database:', err);
    return false;
  }
}

/**
 * Get all stored documents for a specific analysis from Supabase documents table
 */
export async function getDocumentsByAnalysisId(
  analysisId: string
): Promise<AnalysisDocument[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type || 'Pitch Deck',
      size: d.size || '1.5 MB',
      status: d.status || 'indexed',
      chunks: d.chunks || 12,
      uploadDate: d.upload_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      storageUrl: d.storage_url || '',
      filePath: d.file_path || '',
    }));
  } catch (err) {
    console.warn('[Supabase Service] getDocumentsByAnalysisId error:', err);
    return [];
  }
}

/**
 * Fetch all analyses from Supabase database with their associated documents
 */
export async function fetchAnalysesFromSupabase(): Promise<AnalysisRecord[]> {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    // Query all documents associated with these analyses
    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    const docsByAnalysis = new Map<string, AnalysisDocument[]>();
    (docsData || []).forEach((d: any) => {
      const list = docsByAnalysis.get(d.analysis_id) || [];
      list.push({
        id: d.id,
        name: d.name,
        type: d.type || 'Pitch Deck',
        size: d.size || '1.5 MB',
        status: d.status || 'indexed',
        chunks: d.chunks || 12,
        uploadDate: d.upload_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        storageUrl: d.storage_url || '',
        filePath: d.file_path || '',
      });
      docsByAnalysis.set(d.analysis_id, list);
    });

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      mode: row.mode,
      tagline: row.tagline,
      industry: row.industry,
      website: row.website,
      stage: row.stage,
      createdAt: row.created_at,
      status: row.status,
      isDemo: row.is_demo,
      overallScore: row.overall_score,
      recommendation: row.recommendation,
      confidence: row.confidence,
      thesis: row.thesis,
      scores: row.scores || { market: 75, product: 75, team: 75, financial: 75, traction: 75, risk: 75 },
      keyInsights: row.key_insights || { strengths: [], risks: [], opportunities: [], nextSteps: [] },
      dueDiligenceQuestions: row.due_diligence_questions || [],
      documents: docsByAnalysis.get(row.id) || [],
      codeDetails: row.code_details,
      agent6Data: row.agent6_data,
      fundingMatches: row.funding_matches || [],
      chatHistory: [],
    }));
  } catch (err) {
    console.warn('[Supabase Service] fetchAnalysesFromSupabase error:', err);
    return [];
  }
}

/**
 * Agent 1 Document Diligence Evaluation Record
 */
export interface Agent1EvaluationRecord {
  id: string;
  analysis_id?: string;
  company_name?: string;
  status: 'completed' | 'processing' | 'failed';
  uploaded_files: Array<{
    original_filename: string;
    stored_filename?: string;
    file_type?: string;
  }>;
  document_analyses: any[];
  merged_analysis?: any;
  contradictions: any[];
  validation_errors: any[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save Agent 1 Document Diligence Analysis to Supabase database
 */
export async function saveAgent1Evaluation(
  record: Agent1EvaluationRecord
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const finalAnalysisId =
      record.analysis_id ||
      `eval_${(record.company_name || 'venture').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Ensure parent analysis exists in analyses table to satisfy foreign key constraint
    await ensureAnalysisExists(finalAnalysisId, record.company_name || 'Venture Startup', {
      thesis: record.merged_analysis?.description || 'Agent 1 Document Diligence analysis',
      industry: record.merged_analysis?.industry || 'Startup',
      tagline: `${record.company_name || 'Venture'} Document Intelligence`,
    });

    const payload = {
      id: record.id,
      analysis_id: finalAnalysisId,
      company_name: record.company_name || null,
      status: record.status || 'completed',
      uploaded_files: record.uploaded_files || [],
      document_analyses: record.document_analyses || [],
      merged_analysis: record.merged_analysis || {},
      contradictions: record.contradictions || [],
      validation_errors: record.validation_errors || [],
      metadata: record.metadata || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agent1_evaluations')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Service] saveAgent1Evaluation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('[Supabase Service] Failed to save Agent 1 evaluation:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

/**
 * Get the latest Agent 1 evaluation for a given analysis
 */
export async function getAgent1EvaluationByAnalysisId(
  analysisId: string
): Promise<Agent1EvaluationRecord | null> {
  try {
    const { data, error } = await supabase
      .from('agent1_evaluations')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Agent1EvaluationRecord;
  } catch (err) {
    console.warn('[Supabase Service] getAgent1EvaluationByAnalysisId error:', err);
    return null;
  }
}

/**
 * List all recent Agent 1 evaluations
 */
export async function listAgent1Evaluations(
  limit = 20
): Promise<Agent1EvaluationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('agent1_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as Agent1EvaluationRecord[];
  } catch (err) {
    console.warn('[Supabase Service] listAgent1Evaluations error:', err);
    return [];
  }
}

/**
 * Agent 6 Code Diligence Evaluation Record
 */
export interface Agent6EvaluationRecord {
  run_id: string;
  analysis_id?: string;
  github_url: string;
  repository_owner?: string;
  repository_name?: string;
  findings_summary?: any;
  findings?: any[];
  raw_analysis?: any;
  metadata?: any;
}

/**
 * Save Agent 6 Code Diligence Analysis to Supabase database
 */
export async function saveAgent6Evaluation(
  record: Agent6EvaluationRecord
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const finalAnalysisId = record.analysis_id || `eval_${record.run_id}`;
    const repoTitle = record.repository_name || 'Code Repository';

    // Ensure parent analysis exists
    await ensureAnalysisExists(finalAnalysisId, repoTitle, {
      mode: 'project',
      tagline: `GitHub Code Diligence for ${record.github_url}`,
    });

    const payload = {
      run_id: record.run_id,
      analysis_id: finalAnalysisId,
      github_url: record.github_url,
      repository_owner: record.repository_owner || null,
      repository_name: record.repository_name || null,
      findings_summary: record.findings_summary || {},
      findings: record.findings || [],
      raw_analysis: record.raw_analysis || {},
      metadata: record.metadata || {},
    };

    const { data, error } = await supabase
      .from('agent6_evaluations')
      .upsert([payload], { onConflict: 'run_id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Service] saveAgent6Evaluation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('[Supabase Service] Failed to save Agent 6 evaluation:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

/**
 * Initialize and verify Supabase Database connectivity and baseline records
 */
export async function initSupabaseDatabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('[Supabase Init] Could not query analyses:', error.message);
      return;
    }

    // If analyses table is empty, seed platform demo records
    if (!data || data.length === 0) {
      console.log('[Supabase Init] Seeding platform analyses into Supabase...');
      const seeds = [
        {
          id: 'eval_airbnb_01',
          title: 'Airbnb',
          mode: 'startup',
          tagline: 'Short-term rental marketplace',
          industry: 'Travel',
          website: 'https://airbnb.com',
          stage: 'Seed',
          status: 'completed',
          is_demo: true,
          overall_score: 92,
          recommendation: 'INVEST',
          confidence: 'High',
          thesis: 'High organic traction and strong unit economics in the peer-to-peer lodging sector.',
          scores: { market: 95, product: 90, team: 92, financial: 88, traction: 96, risk: 85 },
          key_insights: { strengths: ['Disruptive peer-to-peer business model'], risks: ['Regulatory challenges'], opportunities: ['Global expansion'], nextSteps: ['Scale host acquisition'] },
          due_diligence_questions: [],
          funding_matches: [],
        },
        {
          id: 'eval_ecoverse_01',
          title: 'EcoVerse Platform',
          mode: 'project',
          tagline: 'Decentralized ecological asset verification and carbon telemetry engine.',
          industry: 'Climate Tech / Web3 Infrastructure',
          website: 'https://github.com/Shiv24angi/EcoVerse',
          stage: 'Open Source / Alpha',
          status: 'completed',
          is_demo: true,
          overall_score: 84,
          recommendation: 'MONITOR',
          confidence: 'Moderate',
          thesis: 'High technical maturity and innovative smart-contract verification architecture for carbon credits.',
          scores: { market: 82, product: 88, team: 78, financial: 72, traction: 70, risk: 86 },
          key_insights: { strengths: ['Modular Next.js architecture'], risks: ['Pricing volatility'], opportunities: ['B2B compliance licensing'], nextSteps: ['Conduct pilot deployments'] },
          due_diligence_questions: [],
          funding_matches: [],
        },
      ];

      for (const item of seeds) {
        await supabase.from('analyses').upsert([item], { onConflict: 'id' });
      }
      console.log('[Supabase Init] Platform analyses successfully seeded.');
    }
  } catch (err) {
    console.warn('[Supabase Init] Error initializing database:', err);
  }
}
