import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client using your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    // Read the JSON data (jobId and ceoId) sent from the frontend modal
    const { jobId, ceoId } = await request.json();

    // Insert the new log into the Supabase 'application_logs' table
    const { error } = await supabase
     .from('application_logs')
     .insert([
        { job_id: jobId, ceo_id: ceoId }
      ]);

    // If Supabase rejects the insert, trigger the error catch block
    if (error) {
        throw error;
    }

    // Tell the frontend that the save was successful
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to log application:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
