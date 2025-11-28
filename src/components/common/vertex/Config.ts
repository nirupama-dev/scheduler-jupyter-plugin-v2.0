export const uiConfigAPIResponseTransform = (responseObject: any) => {
  const formattedResponse: any = {};
  for (const key in responseObject) {
    if (Object.hasOwn(responseObject, key)) {
      // Ensure it's own property
      if (key === 'acceleratorConfigs' && Array.isArray(responseObject[key])) {
        // If it's acceleratorConfigs, deep transform its array elements
        formattedResponse[key] = responseObject[key].map((config: any) => {
          const transformedConfig: any = {};
          for (const configKey in config) {
            if (Object.hasOwn(config, configKey)) {
              if (configKey === 'allowedCounts') {
                transformedConfig[configKey] = config.allowedCounts.map(
                  (count: number) => {
                    return {
                      label: count,
                      value: count
                    };
                  }
                );
              } else {
                transformedConfig[configKey] = {
                  label: config[configKey],
                  value: config[configKey]
                };
              }
            }
          }
          return transformedConfig;
        });
      } else {
        // For all other keys, apply the standard label-value transformation
        formattedResponse[key] = {
          label: responseObject[key],
          value: responseObject[key]
        };
      }
    }
  }
  return formattedResponse;
};
