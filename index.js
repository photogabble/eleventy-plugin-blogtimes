const BDFFont = require("bdf-canvas").BDFFont;
const gitLog = require('git-log-parser');
const {createCanvas} = require('canvas');
const {createHash} = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * @param cwd {string|undefined}
 * @param lastXDays {number}
 * @return {Promise<Array>}
 */
const getPostTimes = (cwd, lastXDays = 30) => new Promise((resolve) => {
  const arr = [];

  gitLog.parse({
    since: `${lastXDays} days ago`
  }, {
    cwd
  }).on('data', function (chunk) {
    const date = chunk?.author?.date;
    if (!date) return;
    arr.push((date.getHours() * 60) + date.getMinutes());
  }).on('end', () => resolve(arr));
});

/**
 * Port of Blogtimes from Matt Mullenweg's WordPress plugin of the same name.
 * Original version for b2 was written by Sanjay Sheth.
 * @param { string } gitSrc
 * @param { import('@photogabble/eleventy-plugin-blogtimes').EleventyPluginBlogtimesOptions} options
 * @returns {Promise<import('canvas').Canvas>}
 */
const makeBlogtimeImage = async (gitSrc, options) => {
  const monthText = `Last ${options.lastXDays} days`;

  // create the basic image
  const canvas = createCanvas(options.width, options.height)
  const ctx = canvas.getContext('2d');
  ctx.antialias = 'none';

  // load 6x12 font
  const bdfbody = fs.readFileSync(__dirname+'/fonts/6x12.bdf');
  const font = new BDFFont(bdfbody.toString());

  const fontWidth = 6;
  const fontHeight = 12;

  // define what color to use where
  const backColor = '#FFFFFF';
  const boxColor = '#EEEEEE';
  const textColor = '#000000';
  const lineColor = 'rgba(0,0,0,0.40)';
  const borderColor = '#000000';

  // query the collection and build the list
  const postTimes = await getPostTimes(gitSrc, options.lastXDays);

  // calculate how many intervals to show
  const intervals = Math.floor(options.width / 40);
  let iMod = 24;

  if (intervals >= 24) {
    iMod = 1;
  } else if (intervals >= 12) {
    iMod = 2;
  } else if (intervals >= 8) {
    iMod = 3;
  } else if (intervals >= 6) {
    iMod = 4;
  } else if (intervals >= 4) {
    iMod = 6;
  } else if (intervals >= 3) {
    iMod = 8;
  } else if (intervals >= 2) {
    iMod = 16;
  }

  // fill the image with the background color
  ctx.fillStyle = backColor;
  ctx.fillRect(0, 0, options.width, options.height);

  // box position
  const x = options.hPadding;
  const w = options.width - (options.hPadding * 2);
  const y = fontHeight + options.vPadding;
  const h = options.height - (options.height - options.vPadding - fontHeight);

  // inner box positions
  const left = options.hPadding;
  const right = options.width - options.hPadding;
  const bottom = options.height - options.vPadding - fontHeight;

  ctx.fillStyle = boxColor;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = borderColor;
  ctx.rect(x, y, w, h);
  ctx.stroke();

  // write title and monthText
  ctx.fillStyle = textColor;
  font.drawText(ctx, options.title, x, 10);
  font.drawText(ctx, monthText, (options.width - options.hPadding) - (monthText.length * fontWidth), 10);

  // add the legend on the bottom
  for (let i = 0; i <= 24; i++) {
    if (i % iMod === 0) {
      const curX = left + (right - left) / 24 * i;
      const strX = (i > 9)
        ? curX - 5
        : curX - 2;

      ctx.fillStyle = textColor;
      font.drawText(ctx, `${i >= 24 ? 0 : i}`, strX, y + h + fontHeight);

      // Show ticks
      if (options.showTicks) {
        ctx.beginPath();
        ctx.moveTo(curX, h + y);
        ctx.lineTo(curX, h + y + 5);
        ctx.stroke();
      }
    }
  }

  if (options.unitName) {
    const curX = (right + left) / 2 - (fontWidth * options.unitName.length / 2);
    const curY = bottom + fontHeight;
    font.drawText(ctx, options.unitName, curX, curY);
  }

  // now we draw the lines for each post
  // the post times should be in terms of # of days since now
  ctx.strokeStyle = lineColor;
  for (const day of postTimes) {
    // make sure postTime is between 0 and 1439
    const currentPostTime = Math.abs(day) % 1440;

    // 1440 minutes per day
    const curX = left + (right - left) / 1440 * currentPostTime;

    // draw the post line
    ctx.beginPath();
    ctx.moveTo(curX, y);
    ctx.lineTo(curX, y + h);
    ctx.stroke();
  }

  return canvas;
};

/**
 * @param { import('@photogabble/eleventy-plugin-blogtimes').DirectoriesConfig } [directoriesConfig]
 * @param { import('@photogabble/eleventy-plugin-blogtimes').EleventyPluginBlogtimesOptions } [pluginOptions]
 * */
const mergeOptions = (directoriesConfig, pluginOptions) => {
  return {
    width: 480,
    height: 65,
    title: 'Git Commits',
    lastXDays: 90,
    hPadding: 5,
    vPadding: 5,
    showTicks: true,
    unitName: 'hour of day',

    outputFileExtension: 'png',
    outputDir: path.join(directoriesConfig ? directoriesConfig.output : '', 'bt-images/'),
    urlPath: '/bt-images/',
    hashLength: 10,
    generateHTML: (outputUrl, options) => `<img alt="Blogtimes histogram" width="${options.width}" height="${options.height}" src="${outputUrl}" />`,
    ...pluginOptions,
  }
}
/**
 * @param { Buffer } [img]
 * @param { import('@photogabble/eleventy-plugin-blogtimes').EleventyPluginBlogtimesOptions } [options]
 */
const getOutputParameters = (img, options) => {
  const hash = createHash('sha256').update(img).digest('base64url').substring(0, options.hashLength);
  const outputFilename = `${hash}.${options.outputFileExtension}`;
  const outputFilePath = path.join(options.outputDir, outputFilename);
  const outputUrl = path.join(options.urlPath, outputFilename);

  return { outputFilename, outputFilePath, outputUrl };
};

/**
 *
 * @param { import('@11ty/eleventy/src/UserConfig') } eleventyConfig
 * @param { import('@photogabble/eleventy-plugin-blogtimes').EleventyPluginBlogtimesOptions} pluginOptions
 */
module.exports = function (eleventyConfig, pluginOptions) {
  let directoriesConfig;
  eleventyConfig.on('eleventy.directories', (dir) => {
    directoriesConfig = dir;
  });

  eleventyConfig.addAsyncShortcode('blogtimes', async (gitPath, shortCodeOptions) => {
    const options = mergeOptions(directoriesConfig, pluginOptions);

    if (!gitPath) gitPath = directoriesConfig.input;

    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, {recursive: true});
    }

    const canvas = await makeBlogtimeImage(gitPath, options);
    const buffer = canvas.toBuffer("image/png"); // TODO: Listen to options.outputFileExtension

    const { outputFilePath, outputUrl } = getOutputParameters(buffer, options);

    fs.writeFileSync(outputFilePath, buffer);
    return options.generateHTML(outputUrl, {...options, ...shortCodeOptions});
  });
};
