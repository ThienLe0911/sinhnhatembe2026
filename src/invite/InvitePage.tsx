import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import { browserCopyDeps, browserShare, copyText, downloadTextFile, shareInvite } from './actions'
import {
  buildIcs,
  formatClock,
  formatDate,
  formatTimeRange,
  googleCalendarUrl,
  mapsUrl,
} from './calendar'
import { inviteContent, type InviteContent } from './content'
import { InfoIcon, StepArt } from './icons'
import styles from './InvitePage.module.css'
import { LinkButton } from './LinkButton'
import { isValidDate } from './validate'

const NOTICE_MS = 2400

// Mỗi khối hiện lên lần lượt; MotionProvider tự bỏ phần dịch chuyển khi bật giảm chuyển động
const enter = (index: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { ...springs.soft, delay: 0.08 * index },
})

export function InvitePage({ content = inviteContent }: { content?: InviteContent }) {
  const [notice, setNotice] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const hasDate = isValidDate(content.date)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const say = useCallback((message: string) => {
    setNotice(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }, [])

  const copyAddress = useCallback(async () => {
    const ok = await copyText(content.venue.address, browserCopyDeps())
    say(ok ? 'Đã sao chép địa chỉ' : 'Chưa sao chép được, bạn giữ vào địa chỉ để chép nhé')
  }, [content.venue.address, say])

  const share = useCallback(async () => {
    const result = await shareInvite(
      { ...content.share, url: window.location.href },
      { share: browserShare(), copy: (text) => copyText(text, browserCopyDeps()) },
    )
    if (result === 'copied') say('Đã sao chép link')
    if (result === 'failed') say('Chưa chia sẻ được, bạn sao chép link trên thanh địa chỉ nhé')
  }, [content.share, say])

  const downloadIcs = useCallback(() => {
    const ok = downloadTextFile(
      'sinh-nhat-minh-thu.ics',
      'text/calendar;charset=utf-8',
      buildIcs(content, new Date()),
    )
    say(ok ? 'Đang tải file lịch…' : 'Chưa tải được file lịch, bạn dùng Google Calendar nhé')
  }, [content, say])

  return (
    <Stage>
      <div className={styles.page}>
        <motion.header className={styles.hero} {...enter(0)}>
          <p className={styles.eyebrow}>Thiệp mời</p>
          <div className={styles.mascot}>
            <Mascot state="celebrate" label="Em bé Minh Thư vẫy tay chào" />
          </div>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.subtitle}>{content.subtitle}</p>
          <ul className={styles.chips}>
            <li className={styles.chip}>
              <InfoIcon name="calendar" />
              <span>{formatDate(content.date)}</span>
            </li>
            <li className={styles.chip}>
              <InfoIcon name="clock" />
              <span>{formatClock(content.start)}</span>
            </li>
          </ul>
        </motion.header>

        {content.confidentialNote ? (
          <motion.p className={styles.secret} role="note" {...enter(1)}>
            {content.confidentialNote}
          </motion.p>
        ) : null}

        <motion.section className={styles.card} aria-labelledby="venue-heading" {...enter(2)}>
          <h2 id="venue-heading" className={styles.cardTitle}>
            <InfoIcon name="pin" />
            Địa điểm
          </h2>
          <p className={styles.venueName}>{content.venue.name}</p>
          <p className={styles.address}>{content.venue.address}</p>
          <div className={styles.row}>
            <LinkButton href={mapsUrl(content.venue)}>Mở bản đồ</LinkButton>
            <Button variant="secondary" onClick={() => void copyAddress()}>
              Sao chép địa chỉ
            </Button>
          </div>
        </motion.section>

        <motion.section className={styles.card} aria-labelledby="timeline-heading" {...enter(3)}>
          <h2 id="timeline-heading" className={styles.cardTitle}>
            <InfoIcon name="clock" />
            Lịch trình
          </h2>
          <ol className={styles.timeline}>
            {content.timeline.map((step) => (
              <li key={step.from} className={styles.step}>
                <p className={styles.stepTime}>{formatTimeRange(step.from, step.to)}</p>
                <div className={styles.stepBody}>
                  <StepArt icons={step.icons} />
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        {hasDate ? (
          <motion.section className={styles.card} aria-labelledby="calendar-heading" {...enter(4)}>
            <h2 id="calendar-heading" className={styles.cardTitle}>
              <InfoIcon name="calendar" />
              Thêm vào lịch
            </h2>
            <div className={styles.row}>
              <LinkButton href={googleCalendarUrl(content)} variant="secondary">
                Google Calendar
              </LinkButton>
              <Button variant="secondary" onClick={downloadIcs}>
                Tải file lịch (.ics)
              </Button>
            </div>
            <p className={styles.hint}>
              Không tải được file lịch? Hãy mở link này trong Safari hoặc Chrome, hoặc dùng Google
              Calendar.
            </p>
          </motion.section>
        ) : null}

        <motion.p className={styles.closing} {...enter(5)}>
          {content.closing}
        </motion.p>

        <motion.div className={styles.actions} {...enter(6)}>
          {content.rsvp ? (
            <LinkButton href={content.rsvp.href}>{content.rsvp.label}</LinkButton>
          ) : null}
          <Button variant={content.rsvp ? 'secondary' : 'primary'} onClick={() => void share()}>
            Chia sẻ lời mời
          </Button>
        </motion.div>

        <div
          className={styles.notice}
          role="status"
          aria-live="polite"
          data-visible={notice !== null}
        >
          {notice}
        </div>
      </div>
    </Stage>
  )
}
