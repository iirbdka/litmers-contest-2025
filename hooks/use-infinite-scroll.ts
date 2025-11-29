"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseInfiniteScrollOptions<T> {
  initialData: T[]
  fetchMore: (page: number) => Promise<T[]>
  pageSize?: number
}

export function useInfiniteScroll<T>({ initialData, fetchMore, pageSize = 10 }: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newData = await fetchMore(page + 1)
      if (newData.length < pageSize) {
        setHasMore(false)
      }
      setData((prev) => [...prev, ...newData])
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to fetch more data:", error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, fetchMore, pageSize])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMore])

  return {
    data,
    loading,
    hasMore,
    loadMoreRef,
    reset: () => {
      setData(initialData)
      setPage(1)
      setHasMore(true)
    },
  }
}
