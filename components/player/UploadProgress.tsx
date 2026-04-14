'use client'

import { useState, useRef } from 'react'
import { Loader2, CheckCircle, XCircle, Upload } from 'lucide-react'

interface UploadProgressProps {
  onUploadComplete: (key: string, publicUrl?: string) => void
  fileType: 'video' | 'image' | 'book'
  accept?: string
  label?: string
}

type UploadState = 'idle' | 'requesting' | 'uploading' | 'done' | 'error'

export function UploadProgress({
  onUploadComplete,
  fileType,
  accept,
  label,
}: UploadProgressProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultAccept = {
    video: 'video/mp4,video/webm',
    image: 'image/jpeg,image/png,image/webp',
    book: 'application/pdf',
  }[fileType]

  async function handleFile(file: File) {
    setState('requesting')
    setProgress(0)
    setErrorMsg(null)

    try {
      // 1. Получить presigned URL
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: file.type, file_type: fileType }),
      })

      const json = await res.json() as {
        data: { upload_url: string; key: string; public_url?: string } | null
        error: string | null
      }

      if (!res.ok || !json.data) throw new Error(json.error ?? 'Ошибка получения URL')

      const { upload_url, key, public_url } = json.data

      // 2. Загрузить файл напрямую в YOS через XHR (для прогресса)
      setState('uploading')
      await uploadWithProgress(file, upload_url, setProgress)

      setState('done')
      onUploadComplete(key, public_url)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? defaultAccept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {state === 'idle' && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 w-full text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload className="h-8 w-8" />
          <span className="text-sm">{label ?? 'Нажмите для загрузки файла'}</span>
        </button>
      )}

      {(state === 'requesting' || state === 'uploading') && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {state === 'requesting' ? 'Подготовка...' : `Загрузка ${progress}%`}
          </p>
          {state === 'uploading' && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {state === 'done' && (
        <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-8 w-8" />
          <p className="text-sm">Файл загружен успешно</p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button
            onClick={() => setState('idle')}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  )
}

function uploadWithProgress(
  file: File,
  url: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Ошибка загрузки: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Сетевая ошибка')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
