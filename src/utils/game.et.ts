/**
 * Eorzea Game Time Calculator.
 * 
 * Constructor:
 * ```ts
    constructor(date?: Date)
    // date ??= new Date()
 * ```
 * 
 * Example:
 * ``` ts
    import EorzeaTime from '@/tools/EorzeaTime'
    const eorzeaTime = ref<EorzeaTime>(new EorzeaTime())
    setInterval(() => {
      eorzeaTime.value = new EorzeaTime()
    }, 200)
 * ```
 */
class EorzeaTime {
  private static TimeRate : number = 175
  private static MinutesOfHour : number = 60
  private static HoursOfDay : number = 24
  private static DaysOfMonth : number = 32
  private static MonthsOfYear : number = 12

  private _year: number
  private _month: number
  private _day: number
  private _hour: number
  private _minute: number
  private _timeStamp: number

  private _local_date: Date

  get year(): number {
    return Math.floor(this._year)
  }
  get month(): number {
    return Math.floor(this._month)
  }
  get day(): number {
    return Math.floor(this._day)
  }
  get hour(): number {
    return Math.floor(this._hour)
  }
  get minute(): number {
    return Math.floor(this._minute)
  }

  /**
   * get eorzea time string in the format like in-game display.
   * Sample: `15:31`
   */
  get gameTime(): string {
    return `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`
  }

  /**
   * get earth local time string in the format like in-game display.
   * Sample: `15:31`
   */
  get localTime(): string {
    const hour = this._local_date.getHours()
    const minute = this._local_date.getMinutes()
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * get the timestamp (total minutes) of this eorzea time.
   */
  get timeStamp(): number {
    return this._timeStamp
  }

  /**
   * Build the eorzea time by the given earth time.
   * @param date would become `new Date()` if it's not given.
   */
  constructor(date?: Date) {
    date ??= new Date()
    this._local_date = date
    const totalSeconds = date.getTime() / 1000

    const eorzeaMinutes = Math.floor(totalSeconds * EorzeaTime.MinutesOfHour / EorzeaTime.TimeRate)
    const eorzeaHours = eorzeaMinutes / EorzeaTime.MinutesOfHour
    const eorzeaDays = eorzeaHours / EorzeaTime.HoursOfDay
    const eorzeaMonths = eorzeaDays / EorzeaTime.DaysOfMonth

    this._timeStamp = eorzeaMinutes

    let Y = eorzeaMonths / EorzeaTime.MonthsOfYear + 1
    let M = eorzeaMonths % EorzeaTime.MonthsOfYear + 1
    let D = eorzeaDays % EorzeaTime.DaysOfMonth + 1
    let h = eorzeaHours % EorzeaTime.HoursOfDay
    let m = eorzeaMinutes % EorzeaTime.MinutesOfHour

    if (M > EorzeaTime.MonthsOfYear) {
      M -= EorzeaTime.MonthsOfYear; Y++
    }
    this._year = Y

    if (D > EorzeaTime.DaysOfMonth) {
      D -= EorzeaTime.DaysOfMonth; M++
    }
    this._month = M

    if (h > EorzeaTime.HoursOfDay) {
      h -= EorzeaTime.HoursOfDay; D++
    }
    this._day = D

    if (m > EorzeaTime.MinutesOfHour) {
      m -= EorzeaTime.MinutesOfHour; h++
    }
    this._hour = h; this._minute = m
  }

  public static EorzeaMinute2LocalSecond = (eorzeaMinute: number) => {
    return eorzeaMinute * EorzeaTime.TimeRate / EorzeaTime.MinutesOfHour
  }
}

export default EorzeaTime