import type {
  ApiExercise,
  ApiPersonalRecord,
  ApiSet,
  ApiWorkout,
  ApiWorkoutDetail,
  Exercise,
  PersonalRecord,
  SetEntry,
  Workout,
} from '../types'

export function mapExercise(exercise: ApiExercise): Exercise {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup ?? 'Other',
    equipment: exercise.equipment ?? '—',
    category: exercise.compound ? 'Compound' : 'Isolation',
    latestPerformance: '—',
    bestE1rm: 0,
    description: exercise.description,
    movementType: exercise.movementType,
  }
}

export function mapSet(set: ApiSet): SetEntry {
  return {
    id: set.id,
    number: set.setNumber,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe,
    rir: set.rir,
    warmup: set.warmup,
    failure: set.failure,
  }
}

export function mapWorkout(workout: ApiWorkout): Workout {
  const startedAt = workout.startedAt
  const completedAt = workout.completedAt
  const durationMinutes = startedAt && completedAt
    ? Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 60_000))
    : 0

  return {
    id: workout.id,
    userId: workout.userId,
    name: workout.name ?? 'Workout',
    date: workout.workoutDate,
    startedAt,
    completedAt,
    notes: workout.notes,
    durationMinutes,
    exercises: [],
    completed: completedAt !== null,
    personalRecords: [],
  }
}

export function mapWorkoutDetail(detail: ApiWorkoutDetail): Workout {
  return {
    ...mapWorkout(detail.workout),
    exercises: detail.exercises
      .slice()
      .sort((left, right) => left.exerciseOrder - right.exerciseOrder)
      .map((entry) => ({
        order: entry.exerciseOrder,
        sessionId: entry.id,
        exercise: {
          id: entry.exerciseId,
          name: entry.exerciseName,
          muscleGroup: 'Other',
          equipment: '—',
          category: 'Compound',
          latestPerformance: '—',
          bestE1rm: 0,
        },
        sets: entry.sets.slice().sort((left, right) => left.setNumber - right.setNumber).map(mapSet),
      })),
  }
}

const recordLabels: Record<ApiPersonalRecord['type'], PersonalRecord['type']> = {
  MAX_WEIGHT: 'Weight PR',
  MAX_REPS: 'Rep PR',
  ESTIMATED_ONE_REP_MAX: 'Estimated 1RM PR',
  VOLUME: 'Volume PR',
}

export function mapPersonalRecord(record: ApiPersonalRecord): PersonalRecord {
  const unit = record.type === 'MAX_REPS' ? ' reps' : ' kg'
  return {
    id: record.id,
    exercise: record.exerciseName,
    type: recordLabels[record.type],
    value: `${record.value}${unit}`,
    date: record.achievedAt,
  }
}

export function mapApiSet(set: SetEntry) {
  return {
    setNumber: set.number,
    weight: set.weight,
    reps: set.reps,
    ...(set.rpe === null ? {} : { rpe: set.rpe }),
    ...(set.rir === null ? {} : { rir: set.rir }),
    warmup: set.warmup,
    failure: set.failure,
  }
}
