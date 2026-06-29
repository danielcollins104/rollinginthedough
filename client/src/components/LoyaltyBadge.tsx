/**
 * LoyaltyBadge - Displays loyalty achievement badges based on player progress
 * Shows streak milestones, level milestones, and special achievements
 */
import { useRetention } from '@/hooks/useRetention'
import { Badge } from '@/components/ui/badge'
import { STREAK_MILESTONES } from '@/hooks/useRetention'

export function LoyaltyBadge() {
  const {
    currentStreak,
    level,
    missions,
    todayClaimed,
    claimDailyBonus,
    addXp,
  } = useRetention()

  // Calculate achieved streak milestones
  const achievedStreakMilestones = STREAK_MILESTONES.filter(
    (m) => currentStreak >= m
  )

  // Level milestones (every 5 levels)
  const levelMilestones = []
  for (let l = 5; l <= level; l += 5) {
    levelMilestones.push(l)
  }

  // Mission completion status
  const allMissionsCompleted = missions.every((m) => m.completed)
  const completedMissionCount = missions.filter((m) => m.completed).length
  const totalMissions = missions.length

  // Special achievements
  const achievements = []

  // Streak milestones
  achievedStreakMilestones.forEach((milestone) => {
    achievements.push({
      id: `streak_${milestone}`,
      label: `${milestone} Day Streak`,
      icon: '🔥',
      color: 'orange',
    })
  })

  // Level milestones
  levelMilestones.forEach((milestone) => {
    achievements.push({
      id: `level_${milestone}`,
      label: `Level ${milestone}`,
      icon: '⭐',
      color: 'purple',
    })
  })

  // Mission achievements
  if (completedMissionCount > 0) {
    achievements.push({
      id: 'missions_started',
      label: `Missions Started`,
      icon: '📋',
      color: 'blue',
    })
  }
  if (allMissionsCompleted && totalMissions > 0) {
    achievements.push({
      id: 'missions_master',
      label: 'Mission Master',
      icon: '🏆',
      color: 'gold',
    })
  }

  // Daily loyalty (claimed today)
  if (todayClaimed) {
    achievements.push({
      id: 'daily_loyalty',
      label: 'Daily Loyalty',
      icon: '🎁',
      color: 'green',
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((ach) => (
        <Badge
          key={ach.id}
          variant="secondary"
          className="flex items-center gap-1 text-xs font-medium"
        >
          <span>{ach.icon}</span>
          <span>{ach.label}</span>
        </Badge>
      ))}
    </div>
  )
}