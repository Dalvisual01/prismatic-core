import { Plugin } from 'vite';

type PrismaticLayoutPluginOptions = {
    /** Absolute path to the layout module that dev/build should import. */
    layoutFile: string;
    /** POST endpoint used by layout mode persistence. */
    endpoint?: string;
};
declare function prismaticLayoutPlugin(options: PrismaticLayoutPluginOptions): Plugin;

export { type PrismaticLayoutPluginOptions, prismaticLayoutPlugin };
