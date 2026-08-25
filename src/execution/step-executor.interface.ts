export interface StepExecutor {
  execute(config: Record<string, unknown>, context: Record<string, unknown>): Promise<unknown>;
}
