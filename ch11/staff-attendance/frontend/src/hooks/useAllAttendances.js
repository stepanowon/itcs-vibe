import { useQuery } from '@tanstack/react-query'
import { getAllAttendances } from '../api/attendances.js'
import { getAllLeaveRequests } from '../api/leaveRequests.js'
import { listUsers } from '../api/users.js'

export function useAllAttendances({ month, userId }) {
  return useQuery({
    queryKey: ['attendances', 'all', month, userId],
    queryFn: () => getAllAttendances({ month, userId }),
    enabled: !!month,
  })
}

export function useAllLeaveRequestsByMonth(month) {
  return useQuery({
    queryKey: ['leaveRequests', 'all', month],
    queryFn: () => getAllLeaveRequests({ month }),
    enabled: !!month,
  })
}

export function useUsersList() {
  return useQuery({ queryKey: ['users', 'list'], queryFn: listUsers })
}
