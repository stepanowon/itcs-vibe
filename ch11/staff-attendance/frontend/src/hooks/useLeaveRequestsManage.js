import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '../api/leaveRequests.js'

export function useLeaveRequestsManage(status) {
  return useQuery({
    queryKey: ['leaveRequests', 'all', status],
    queryFn: () => getAllLeaveRequests(status ? { status } : {}),
  })
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => approveLeaveRequest(id),
    onSuccess: (_data, id) => {
      if (import.meta.env.DEV) console.log('[leave] approve', id)
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'all'] })
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => rejectLeaveRequest(id),
    onSuccess: (_data, id) => {
      if (import.meta.env.DEV) console.log('[leave] reject', id)
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'all'] })
    },
  })
}
