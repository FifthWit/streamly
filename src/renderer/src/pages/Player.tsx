import { useParams, useLocation } from 'react-router'
import { generateHls, probe, ProbeResponse } from '@renderer/utils/stream'
import { useEffect, useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'
import Hls from 'hls.js'

const devURL = "https://test-videos.co.uk/vids/jellyfish/mkv/1080/Jellyfish_1080_10s_1MB.mkv"

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [hlsError, setHlsError] = useState<string | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  useEffect(() => {
    if (isDev) {
      // Probe the video
      probe(devURL)
        .then(res => {
          setProbeResult(res)
          // Generate HLS URL
          const hls = generateHls(devURL)
          setHlsUrl(hls)
        })
        .catch(err => setProbeError(err.message))
    }
  }, [isDev])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hlsUrl) return

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    setIsVideoReady(false)

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
        setIsVideoReady(true)
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
      setIsVideoReady(true)
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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => {
      setDuration(video.duration)
      setIsVideoReady(true)
    }
    const updatePlayState = () => setIsPlaying(!video.paused)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', updatePlayState)
    video.addEventListener('pause', updatePlayState)
    video.addEventListener('canplay', () => setIsVideoReady(true))

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', updatePlayState)
      video.removeEventListener('pause', updatePlayState)
      video.removeEventListener('canplay', () => setIsVideoReady(true))
    }
  }, [hlsUrl])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

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
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
        playsInline
        controls={false}
      />

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => skip(-10)}
            className="text-white hover:text-primary transition-colors"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlay}
            className="text-white hover:text-primary transition-colors"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button
            onClick={() => skip(10)}
            className="text-white hover:text-primary transition-colors"
          >
            <SkipForward size={24} />
          </button>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={toggleMute}
              className="text-white hover:text-primary transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Video Info */}
          <div className="ml-auto text-sm text-gray-300">
            {probeResult && (
              <span>
                {probeResult.streams[0]?.width}x{probeResult.streams[0]?.height} • {probeResult.streams[0]?.codec}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Buffering Indicator */}
      {!isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Player