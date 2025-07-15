/**
 * Interface for the payload sent from the Create Vertex Scheduler form to the create API.
 */
export interface IVertexSchedulePayload {
  input_filename: string;
  display_name: string;
  machine_type: string;
  kernel_name: string;
  region: string;
  cloud_storage_bucket: string;
  service_account: string;
  network_option?: 'networkInThisProject' | 'networkShared';
  network: string;
  subnetwork: string;
  disk_type: string;
  disk_size: string;
  accelerator_type?: string;
  accelerator_count?: string;
  schedule_value?: string; // Optional: only for scheduled jobs
  time_zone?: string;      // Optional: only for scheduled jobs
  max_run_count?: string;  // Optional: only for scheduled jobs
  start_time?: string;      // Optional: only for scheduled jobs
  end_time?: string;        // Optional: only for scheduled jobs
  parameters?: string[];    //future enhancement: optional parameters for the job
}