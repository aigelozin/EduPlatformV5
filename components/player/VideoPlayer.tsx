'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, AlertCircle } from 'lucide-react'

type VideoSource = 'vk' | 'rutube' | 'kinescope' | 'youtube' | 'yos'

interface VideoPlayerProps {
  lessonId: string
  /** Показывать заглушку без запроса к API (для бесплатного превью) */
  previewUrl?: string
  previewSource?: VideoSource
  className?: string
}

interface VideoData {
  type: 'embed' | 'signed_url'
  source: string
  url: string
}

export function VideoPlayer({ lessonId, previewUrl, previewSource, className }: VideoPlayerProps) {
  const t = useTranslations('player')
  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (previewUrl && previewSource) {
      setVideo({ type: 'embed', source: previewSource, url: previewUrl })
      setLoading(false)
      return
    }

    async function loadVideo() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/video`)
        const json = await res.json() as { data: VideoData | null; error: string | null }

        if (!res.ok || !json.data) {
          setError(json.error ?? t('error'))
          return
        }
        setVideo(json.data)
      } catch {
        setError(t('error'))
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [lessonId, previewUrl, previewSource, t])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg aspect-video ${className ?? ''}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground text-sm">{t('loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-lg aspect-video gap-2 ${className ?? ''}`}>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!video) return null

  // YOS — HTML5 video
  if (video.source === 'yos') {
    return (
      <div className={`relative rounded-lg overflow-hidden aspect-video bg-black ${className ?? ''}`}>
        <video
          src={video.url}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          preload="metadata"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    )
  }

  // Embed (VK, RuTube, Kinescope, YouTube)
  return (
    <div className={`relative rounded-lg overflow-hidden aspect-video bg-black ${className ?? ''}`}>
      <iframe
        src={video.url}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Видеоурок"
      />
    </div>
  )
}
