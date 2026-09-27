import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, createManager } from '../api/users.js'
import { listLeaveBalances } from '../api/leaveBalances.js'
import { getLeavePolicy, updateLeavePolicy } from '../api/leavePolicy.js'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: listUsers })
}

export function useCreateManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
    },
  })
}

export function useLeaveBalances() {
  return useQuery({ queryKey: ['leaveBalances'], queryFn: listLeaveBalances })
}

export function useLeavePolicy() {
  return useQuery({ queryKey: ['leavePolicy'], queryFn: getLeavePolicy })
}

export function useUpdateLeavePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLeavePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leavePolicy'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
    },
  })
}
