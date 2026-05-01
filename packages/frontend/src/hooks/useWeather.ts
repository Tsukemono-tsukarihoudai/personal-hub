import { useEffect, useState } from 'react'

interface Weather {
    temperature: number
    weatherCode: number
}

const DEFAULT_LOCATION = { lat: 35.6762, lon: 139.6503 } // 東京（フォールバック）

function getLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(DEFAULT_LOCATION)
            return
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            ()  => resolve(DEFAULT_LOCATION), // 拒否・エラー時はデフォルト
            { timeout: 5000 },
        )
    })
}

// 引数なし。内部で Geolocation API を試みてフォールバックする。
export function useWeather() {
    const [weather, setWeather] = useState<Weather | null>(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState<string | null>(null)

    useEffect(() => {
        getLocation()
            .then(({ lat, lon }) => {
                const url = new URL('https://api.open-meteo.com/v1/forecast')
                url.searchParams.set('latitude',  String(lat))
                url.searchParams.set('longitude', String(lon))
                url.searchParams.set('current',   'temperature_2m,weather_code')
                url.searchParams.set('timezone',  'auto')
                return fetch(url.toString())
            })
            .then(r => r.json())
            .then((data: any) => {
                setWeather({
                    temperature: data.current.temperature_2m,
                    weatherCode: data.current.weather_code,
                })
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false))
    }, [])

    return { weather, loading, error }
}
