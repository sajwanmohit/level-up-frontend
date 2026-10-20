import { demoStore } from './demoStore'
import type { TrainingSettings } from '../types'

export async function getSettings(): Promise<TrainingSettings> {
  return demoStore.settings()
}

export async function updateSettings(settings: TrainingSettings): Promise<TrainingSettings> {
  return demoStore.saveSettings(settings)
}
