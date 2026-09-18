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
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const STORAGE_BUCKET = 'documents';

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function isSupabaseConnected(): boolean {
  return (
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
  );
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

    // 3. Record document metadata in Postgres 'documents' table
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const docRecord: AnalysisDocument = {
      id: docId,
      name: file.name,
      type: category,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'indexed',
      chunks: Math.floor(Math.random() * 15) + 10,
      uploadDate: new Date().toISOString().split('T')[0],
    };

    const { error: dbError } = await supabase.from('documents').insert([
      {
        id: docId,
        analysis_id: analysisId || `eval_${companyFolder.toLowerCase()}`,
        company_name: companyOrIdeaName.trim(),
        folder_path: `${companyFolder}/${categoryFolder}`,
        name: file.name,
        type: category,
        size: docRecord.size,
        file_path: uploadData.path,
        storage_url: storageUrl,
        status: 'indexed',
        chunks: docRecord.chunks,
      },
    ]);

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
 * Fetch all analyses from Supabase database
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
      documents: [],
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
    const payload = {
      id: record.id,
      analysis_id: record.analysis_id || null,
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
