import { ErrorHandled } from '../_server-utils/errorHandling';

export const DevLog = (
  content: Error | ErrorHandled | string,
  type: 'error' | 'warn' | 'debug' = 'debug'
) => {
  if (process.env.NODE_ENV !== 'production') {
    const message =
      content instanceof ErrorHandled
        ? content.message
        : content instanceof Error
          ? content.message
          : content;

    if (type === 'error' && (content instanceof ErrorHandled || content instanceof Error))
      console.error(`\x1b[31m[ ${type} ] ${message} \x1b[0m`, content);
    else if (type === 'error') console.log(`\x1b[31m[ ${type} ] ${message} \x1b[0m`);

    if (type === 'warn') console.log(`\x1b[33m[ ${type} ] ${message} \x1b[0m`);
    if (type === 'debug') console.log(`\x1b[32m[ ${type} ] ${message} \x1b[0m`);
  }
};
