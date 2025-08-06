import { toast } from "react-toastify";
import { requestAPI } from "../../handler/Handler";
import { IAcceleratorConfig, IMachineType } from "../../interfaces/VertexInterface";
// import { HTTP_STATUS_FORBIDDEN, URL_LINK_PATTERN } from "../../utils/Constants";
import { LOG_LEVEL, SchedulerLoggingService } from "../common/LoggingService";
import { handleErrorToast } from "../../components/common/notificationHandling/ErrorUtils";

// Helper to transform raw API response into IMachineType structure
const uiConfigAPIResponseTransform = (rawItem: any): IMachineType => {
  const transformedAccelerators: IAcceleratorConfig[] = [];
  if (rawItem.acceleratorConfigs && Array.isArray(rawItem.acceleratorConfigs)) {
    for (const config of rawItem.acceleratorConfigs) {
      transformedAccelerators.push({
        acceleratorType: {
          label: config.acceleratorType,
          value: config.acceleratorType
        },
        allowedCounts: config.allowedCounts.map((count: number) => ({
          label: String(count),
          value: count
        }))
      });
    }
  }

  return {
    machineType: {
      label: rawItem.machineType,
      value: rawItem.machineType
    },
    acceleratorConfigs: transformedAccelerators.length > 0 ? transformedAccelerators : null
  };
};
export class VertexServices{
/**
   * Fetches machine types for a given region.
   * This service now returns the fetched data and handles its own error notifications.
   * @param region The region to fetch machine types for.
   * @returns A Promise that resolves with an array of `IMachineType` objects on success,
   * or an empty array if no data or an error occurred.
   * Error messages/toasts are handled internally by this service.
   */
  static async machineTypeAPIService(region: string): Promise<IMachineType[]> {
    try {
      const formattedResponse: any = await requestAPI(`api/vertex/uiConfig?region_id=${region}`);

      if (formattedResponse && Array.isArray(formattedResponse) && formattedResponse.length > 0) {
        const response: IMachineType[] = formattedResponse.map(uiConfigAPIResponseTransform);
        return response; // Return the data
      } else if (formattedResponse?.error) { // Check for `error` property in the response
        // try {
        //   if (formattedResponse.error.code === HTTP_STATUS_FORBIDDEN) {
        //     const url = formattedResponse.error.message.match(URL_LINK_PATTERN);
            
        //     if (url && url.length > 0) {
        //       // setIsApiError(true);
        //       // setApiError(formattedResponse.error.message);
        //       // setApiEnableUrl(url);
        //     } else {
        //       // setApiError(formattedResponse.error.message);
        //     }
        
        //   }
        // } catch (error: any) {
          const errorResponse = `Error fetching machine type list: ${formattedResponse.error}`;
          toast.error(errorResponse, { autoClose: false }); // Throw toast from service
        }
        return[];
      
    } catch (error: any) {
      SchedulerLoggingService.log(`Error listing machine type list: ${error}`, LOG_LEVEL.ERROR);
      const errorResponse = `Failed to fetch machine type list: ${error}`;
      handleErrorToast({ error: errorResponse }); // Throw toast from service
      return []; // Return empty array on caught exception
    }
  };

}
