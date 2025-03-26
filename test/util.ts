import { Server } from '../src/_server';


export const useServer = async (): Promise<Server> => {
  if (!(global as any).serverInstance) {
    (global as any).serverInstance = new Server(true);
    await(global as any).serverInstance.start();
    return (global as any).serverInstance;
  }
  return (global as any).serverInstance;
};
