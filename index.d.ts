type EleventyPluginBlogtimesOptions = {
  width?: number, // Image Width, default: 480
  height?: number, // Image Height, default: 80
  title?: string, // Title output top left, default: 'Git Commits'
  lastXDays?: number, // Time period in days, default: 30
  hPadding?: number, // Padding top and bottom, default: 5
  vPadding?: number, // Padding left and right, default: 5
  showTicks?: boolean, // Show ticks, default: true
  unitName?: string, // Units, displayed centered at bottom, default: 'hour of day'

  outputFileExtension: string, // Image mimetype, default: 'png, must be either png or jpg
  outputDir: string, // Image output directory, default: 'bt-images'
  urlPath: string, // Image url path, default: 'bt-images'
  hashLength?: number; // Image filename hash length, default: 10
}

type DirectoriesConfig = {
  input: string;
  includes: string;
  data: string;
  layouts?: string;
  output: string;
};

export {EleventyPluginBlogtimesOptions, DirectoriesConfig};
