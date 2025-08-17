import { useParams, useLocation } from 'react-router'
import { generateHls, probe, ProbeResponse } from '@renderer/utils/stream'
import { useEffect, useState, useRef } from 'react'
import Hls from 'hls.js'

import { Player as PlayerComponent } from '@renderer/components/player'

const devURL = "https://filesamples.com/samples/video/mkv/sample_3840x2160.mkv"

function Player() {
  const params = useParams()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const isDev = searchParams.get('dev') === 'true'

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [probeResult, setProbeResult] = useState<ProbeResponse | null>(null)
  const [probeError, setProbeError] = useState<string | null>(null)
  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [hlsError, setHlsError] = useState<string | null>(null)

  useEffect(() => {
    if (isDev) {
      probe(devURL)
        .then(res => {
          setProbeResult(res)
          const hls = generateHls(devURL)
          setHlsUrl(hls)
        })
        .catch(err => setProbeError(err.message))
    }
  }, [isDev])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hlsUrl) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
      })
      
      hlsRef.current = hls

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded')
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setHlsError('Network error occurred')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setHlsError('Media error occurred')
              hls.recoverMediaError()
              break
            default:
              setHlsError('Fatal error occurred')
              hls.destroy()
              break
          }
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl
    } else {
      setHlsError('HLS is not supported in this browser')
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [hlsUrl])

  if (!isDev) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2>Player</h2>
          <p>Use ?dev=true to enable development mode</p>
        </div>
      </div>
    )
  }

  if (probeError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <h2>Probe Error</h2>
          <p>{probeError}</p>
        </div>
      </div>
    )
  }

  if (hlsError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <h2>HLS Error</h2>
          <p>{hlsError}</p>
        </div>
      </div>
    )
  }

  if (!hlsUrl || !probeResult) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2>Loading...</h2>
          <p>Probing video and generating HLS stream...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black">
        <PlayerComponent hlsurl={hlsUrl} />
    </div>
  )
}

export default Player