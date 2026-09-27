import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checkIn, checkOut, getMyAttendances } from '../api/attendances.js'
import { getMyLeaveBalance } from '../api/leaveBalances.js'
import { formatDate, formatMonth } from '../utils/date.js'

export function useAttendanceToday() {
  const queryClient = useQueryClient()
  const month = formatMonth()

  const attendancesQuery = useQuery({
    queryKey: ['attendances', 'me', month],
    queryFn: () => getMyAttendances(month),
  })

  const leaveBalanceQuery = useQuery({
    queryKey: ['leaveBalance', 'me'],
    queryFn: getMyLeaveBalance,
  })

  const attendances = attendancesQuery.data ?? []
  const todayRecord = attendances.find((a) => a.workDate === formatDate())
  const workedDays = attendances.filter((a) => a.checkInAt).length

  const invalidateAttendances = (data) => {
    if (import.meta.env.DEV) console.log('[attendance] check-in/out', data.checkInAt ?? data.checkOutAt)
    queryClient.invalidateQueries({ queryKey: ['attendances', 'me'] })
  }

  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: invalidateAttendances,
  })

  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: invalidateAttendances,
  })

  return {
    todayRecord,
    workedDays,
    remainingDays: leaveBalanceQuery.data?.remainingDays,
    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,
  }
}
