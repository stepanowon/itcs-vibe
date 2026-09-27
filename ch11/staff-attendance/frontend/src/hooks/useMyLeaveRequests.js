import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createLeaveRequest, getMyLeaveRequests } from '../api/leaveRequests.js'
import { getMyLeaveBalance } from '../api/leaveBalances.js'

export function useMyLeaveBalance() {
  return useQuery({ queryKey: ['leaveBalance', 'me'], queryFn: getMyLeaveBalance })
}

export function useMyLeaveRequestsList() {
  return useQuery({ queryKey: ['leaveRequests', 'me'], queryFn: () => getMyLeaveRequests() })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: (data) => {
      if (import.meta.env.DEV) console.log('[leave] request created', data.id)
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', 'me'] })
    },
  })
}
