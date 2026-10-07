import clsx from 'clsx'

interface StepConnectorProps {
  stepCount: number
  reach: number
  flowing: boolean
  colorClass: string
}

export const StepConnector = ({ stepCount, reach, flowing, colorClass }: StepConnectorProps) => {
  const segment = 1 / Math.max(stepCount - 1, 1)
  const solid = flowing ? Math.max(0, reach - segment) : reach
  const edge = `${100 / (stepCount * 2)}%`

  return (
    <div className="absolute h-0.5" style={{ left: edge, right: edge, top: 18 }}>
      <div className="absolute inset-0 bg-gray-200" />
      <div
        className={clsx('absolute inset-y-0 left-0 transition-[width] duration-500 ease-out', colorClass)}
        style={{ width: `${solid * 100}%` }}
      />
      {flowing && reach > 0 && (
        <div
          className={clsx('stepper-flow-line absolute inset-y-0 overflow-hidden', colorClass)}
          style={{ left: `${solid * 100}%`, width: `${segment * 100}%` }}
        />
      )}
    </div>
  )
}
