import React from 'react';
import { ReactWidget, IThemeManager } from '@jupyterlab/apputils';
import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material';
import { deepmerge } from '@mui/utils';
 
const baseStyles: ThemeOptions = {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minWidth: 48
        }
      },
      defaultProps: {
        size: 'small'
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: 13
        },
        input: {
          fontSize: 13
        }
      },
      defaultProps: {
        size: 'small'
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        option: {
          fontSize: 13
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 13,
          transform: 'translate(14px, 9px) scale(1)'
        },
        shrink: {
          fontSize: 14,
          transform: 'translate(12px, -7px) scale(0.75)'
        }
      }
    }
  }
};
 
export const lightTheme = createTheme(
  deepmerge(baseStyles, {
    palette: {
      mode: 'light'
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor: 'rgba(0,0,0,0.38)'
          }
        }
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: '#000'
          }
        }
      }
    }
  })
);
 
export const darkTheme = createTheme(
  deepmerge(baseStyles, {
    palette: {
      mode: 'dark',
      primary: {
        main: '#FFFFFF'
      },
      secondary: {
        main: '#7000F2'
      }
    }
  })
);
 
export abstract class SchedulerWidget extends ReactWidget {
  isLight: boolean = true;
 
  constructor(protected themeManager: IThemeManager) {
    super();
    this.themeManager.themeChanged.connect(this.onThemeChanged, this);
    this.updateIsLight();
  }
 
  private updateIsLight() {
    const prevIsLight = this.isLight;
    const currentTheme = this.themeManager.theme;
    if (currentTheme) {
      this.isLight = this.themeManager.isLight(currentTheme);
    } else {
      this.isLight = true;
    }
    return this.isLight !== prevIsLight;
  }
 
  private onThemeChanged() {
    if (this.updateIsLight()) {
      this.update();
    }
  }
 
  dispose() {
    this.themeManager.themeChanged.disconnect(this.onThemeChanged, this);
    return super.dispose();
  }
 
  protected render(): React.ReactElement {
    return (
<ThemeProvider theme={this.isLight ? lightTheme : darkTheme}>
        {this.renderInternal()}
</ThemeProvider>
    );
  }
 
  protected abstract renderInternal(): React.ReactElement;
}