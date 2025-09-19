/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Notification } from '@jupyterlab/apputils';
import { requestAPI } from '../../handler/Handler';
import { LOG_LEVEL, SchedulerLoggingService } from './LoggingService';
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
// import { DropdownOption } from '../../interfaces/FormInterface';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { ISharedNetwork } from '../../interfaces/VertexInterface';
import { IDropdownOption } from '../../interfaces/FormInterface';

export class ComputeServices {
  /**
   * Fetches the parent host project for Shared VPC.
   * Handles error logging and notifications internally.
   *
   * @returns A Promise that resolves with the host project data (or `null` if not found/error).
   */
  static async getParentProjectAPIService(): Promise<any | null> {
    // Adjusted return type
    try {
      const parentProjectResponse: any = await requestAPI(
        'api/compute/getXpnHost'
      );
      if (
        parentProjectResponse &&
        Object.keys(parentProjectResponse).length !== 0
      ) {
        return parentProjectResponse; // Return the data
      }
      return null; // Return null if no data
    } catch (error: any) {
      SchedulerLoggingService.log(
        'Error fetching host project',
        LOG_LEVEL.ERROR
      );
      // Removed setHostProject call
      Notification.error('Failed to fetch host project', { autoClose: false }); // Keep original notification
      return null; // Return null on error
    }
  }

  /**
   * Fetches a list of primary networks.
   * Handles error logging and notifications internally.
   *
   * @returns A Promise that resolves with an array of `ILabelValue<string>` for networks (or empty array on error).
   */
  static async primaryNetworkAPIService(): Promise<ILabelValue<string>[]> {
    // Added async and return type
    try {
      const primaryNetworkResponse: any = await requestAPI(
        'api/compute/network'
      );
      if (
        Array.isArray(primaryNetworkResponse) &&
        primaryNetworkResponse.length > 0
      ) {
        const primaryNetworkList = primaryNetworkResponse.map(
          (network: any) => ({
            label: network.name,
            value: network.selfLink
          })
        );
        primaryNetworkList.sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
        return primaryNetworkList; // Return the data
      } else if (primaryNetworkResponse?.error) {
        // Original error handling for specific API error structure
        throw new Error(primaryNetworkResponse.error); // Throw to be caught in service's catch block
      }
      return []; // Return empty array if no data
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error listing primary network ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch primary network list: ${error}`;
      handleErrorToast({ error: errorResponse }); // Keep original notification
      return []; // Return empty array on error
    }
  }

  /**
   * Fetches a list of subnetworks for a given region and primary network.
   * Handles error logging and notifications internally.
   *
   * @param region The region ID.
   * @param primaryNetworkLink The selfLink of the selected primary network.
   * @returns A Promise that resolves with an array of `ILabelValue<string>` for subnetworks (or empty array on error).
   */
  static async subNetworkAPIService(
    region: string,
    primaryNetworkLink: string | undefined
  ): Promise<ILabelValue<string>[]> {
    // Added async and return type
    try {
      const subNetworkResponse: any = await requestAPI(
        `api/compute/subNetwork?region_id=${region}&network_id=${primaryNetworkLink}`
      );
      if (Array.isArray(subNetworkResponse) && subNetworkResponse.length > 0) {
        const subNetworkList = subNetworkResponse
          .filter((network: any) => network.privateIpGoogleAccess === true)
          .map((network: any) => ({
            label: network.name,
            value: network.selfLink
          }));
        subNetworkList.sort((a, b) => a.label.localeCompare(b.label));
        return subNetworkList; // Return the data
      } else if (subNetworkResponse?.error) {
        // Original error handling for specific API error structure
        throw new Error(subNetworkResponse.error); // Throw to be caught in service's catch block
      }
      return []; // Return empty array if no data
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error listing sub networks ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch sub networks list: ${error}`;
      handleErrorToast({ error: errorResponse }); // Keep original notification
      return []; // Return empty array on error
    }
  }

  /**
   * Fetches a list of shared networks for a given host project and region.
   * Handles error logging, loading state, and notifications internally.
   *
   * @param hostProject The host project ID/name.
   * @param region The region ID.
   * @param setSharedNetworkLoading Callback to update the loading state for shared networks.
   * @returns A Promise that resolves with an array of `{ name: string; network: string; subnetwork: string; }`
   * (or empty array on error).
   */
  static async sharedNetworkAPIService(
    hostProject: string,
    region: string
    // setSharedNetworkLoading: (value: boolean) => void // Loading state still managed by service for this one
  ): Promise<ISharedNetwork[]> {
    // Added return type
    // setSharedNetworkLoading(true); // Start loading here
    try {
      const sharedNetworkResponse: any = await requestAPI(
        `api/compute/sharedNetwork?project_id=${hostProject}&region_id=${region}`
      );
      if (
        Array.isArray(sharedNetworkResponse) &&
        sharedNetworkResponse.length > 0
      ) {
        const sharedNetworkList: ISharedNetwork[] = sharedNetworkResponse.map(
          (network: any) => ({
            name: network.subnetwork.split('/').pop(),
            network: network.network,
            subnetwork: network.subnetwork
          })
        );
        sharedNetworkList.sort((a, b) => a.name.localeCompare(b.name));
        return sharedNetworkList; // Return the data
      }
      return []; // Return empty array if no data
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error listing shared networks ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch shared networks list: ${error}`;
      handleErrorToast({ error: errorResponse }); // Keep original notification
      return []; // Return empty array on error
      // } finally {
      //   setSharedNetworkLoading(false); // Stop loading in finally
      // }
    }
  }
  /**
   * Fetches a list of regions for a given project ID.
   * Handles error logging and notifications internally.
   *
   * @param projectId The project ID to fetch regions for.
   * @returns A Promise that resolves with an array of `DropdownOption` for regions (or empty array on error).
   */

  static readonly regionAPIService = async (
    projectId: string
  ): Promise<IDropdownOption[]> => {
    try {
      const regionResponse: string[] = await requestAPI(
        `api/compute/region?project_id=${projectId}`
      );

      if (!Array.isArray(regionResponse)) {
        throw new Error('Invalid response format for regions');
      }

      const regionOptions: IDropdownOption[] = regionResponse.map(
        (region: string) => ({ value: region, label: region })
      );
      regionOptions.sort((a, b) => a.label.localeCompare(b.label));

      return regionOptions;
    } catch (error) {
      const errorResponse = `Failed to fetch region list : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      throw error;
    }
  };
}
