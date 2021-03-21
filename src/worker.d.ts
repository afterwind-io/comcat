declare module 'web-worker:*' {
  const WorkerFactory: new () => SharedWorker;
  export default WorkerFactory;
}
