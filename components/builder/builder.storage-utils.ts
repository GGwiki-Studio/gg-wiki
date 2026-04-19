'use client'

import type { BuilderProject } from './builder.types'
import { uploadBase64Asset } from '@/lib/storage/project-storage'

export function isBase64(str: string): boolean {
  return str.startsWith('data:')
}

export async function convertBase64ToStorageUrls(
  project: BuilderProject,
  userId: string,
  projectId: string
): Promise<BuilderProject> {
  const updated = structuredClone(project)

  const uploads: Promise<void>[] = []

  // Convert slide background images
  for (const slide of updated.slides) {
    if (slide.backgroundImage && isBase64(slide.backgroundImage)) {
      uploads.push(
        uploadBase64Asset(userId, projectId, slide.backgroundImage, 'backgrounds').then(({ url, error }) => {
          if (!error && url) slide.backgroundImage = url
        })
      )
    }
  }

  // Convert uploaded icons
  for (const icon of updated.uploadedIcons) {
    if (isBase64(icon.src)) {
      uploads.push(
        uploadBase64Asset(userId, projectId, icon.src, 'icons').then(({ url, error }) => {
          if (!error && url) icon.src = url
        })
      )
    }
  }

  // Convert image/icon objects that have base64 src
  for (const slide of updated.slides) {
    for (const obj of slide.objects) {
      if ((obj.type === 'image' || obj.type === 'icon') && isBase64(obj.src)) {
        const folder = obj.type === 'image' ? 'backgrounds' : 'icons'
        uploads.push(
          uploadBase64Asset(userId, projectId, obj.src, folder).then(({ url, error }) => {
            if (!error && url) obj.src = url
          })
        )
      }
    }
  }

  await Promise.all(uploads)
  return updated
}