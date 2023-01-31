type EleventyPluginBlogtimesOptions = {
  width?: number, // Image Width, default: 480
  height?: number, // Image Height, default: 80
  title?: string, // Title output top left, default: 'Git Commits'
  lastXDays?: number, // Time period in days, default: 30
  hPadding?: number, // Padding top and bottom, default: 5
  vPadding?: number, // Padding left and right, default: 5
  showTicks?: boolean, // Show ticks, default: true
  unitName?: string, // Units, displayed centered at bottom, default: 'hour of day'
  src: string, // Git source path, required

  outputFileExtension: string,
  outputDir: string,
  urlPath: string,
  hashLength?: number;
}

type DirectoriesConfig = {
  input: string;
  includes: string;
  data: string;
  layouts?: string;
  output: string;
};

export {EleventyPluginBlogtimesOptions, DirectoriesConfig};
