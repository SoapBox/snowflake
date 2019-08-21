// @flow

import React from 'react'
import TrackSelector from '../components/TrackSelector'
import NightingaleChart from '../components/NightingaleChart'
import KeyboardListener from '../components/KeyboardListener'
import Track from '../components/Track'
import Wordmark from '../components/Wordmark'
import LevelThermometer from '../components/LevelThermometer'
import PointSummaries from '../components/PointSummaries'
import TitleSelector from '../components/TitleSelector'
import { getTrackIds, eligibleTitles, milestones } from '../constants';

type SnowflakeAppState = {
  milestoneByTrack: MilestoneMap,
  name: string,
  title: string,
  focusedTrackId: TrackId,
}

const hashToState = (hash: String, trackIds): ?SnowflakeAppState => {
  if (!hash) return null
  const result = defaultState(trackIds)
  const hashValues = hash.split('#')[1].split(',')
  if (!hashValues) return null
  trackIds.forEach((trackId, i) => {
    result.milestoneByTrack[trackId] = coerceMilestone(Number(hashValues[i]))
  })
  if (hashValues[16]) result.name = decodeURI(hashValues[16])
  if (hashValues[17]) result.title = decodeURI(hashValues[17])
  return result
}

const coerceMilestone = (value: number): Milestone => {
  // HACK I know this is goofy but i'm dealing with flow typing
  switch(value) {
    case 0: return 0
    case 1: return 1
    case 2: return 2
    case 3: return 3
    case 4: return 4
    case 5: return 5
    default: return 0
  }
}

const emptyState = (trackIds): SnowflakeAppState => {
  return {
    name: '',
    title: '',
    milestoneByTrack: trackIds.reduce((acc, trackId) => {
      acc[trackId] = 0
      return acc
    }, {}),
    focusedTrackId: trackIds[0]
  }
}

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const defaultState = (trackIds): SnowflakeAppState => {
  return {
    name: 'Soapbox Simon',
    title: 'Senior Engineer',
    milestoneByTrack: trackIds.reduce((acc, trackId) => {
      acc[trackId] = getRandomIntInclusive(0, 3)
      
      return acc
    }, {}),
    focusedTrackId: trackIds[0]
  }
}

const stateToHash = (state: SnowflakeAppState, trackIds) => {
  if (!state || !state.milestoneByTrack) return null
  const values = trackIds.map(trackId => state.milestoneByTrack[trackId]).concat(encodeURI(state.name), encodeURI(state.title))
  return values.join(',')
}

type Props = {}

class SnowflakeApp extends React.Component<Props, SnowflakeAppState> {
  constructor(props: Props) {
    super(props)
    this.state = {...props.constants};
    this.state.trackIds = getTrackIds(this.state.tracks);
    this.state.user = emptyState(this.state.trackIds);
  }

  componentDidUpdate() {
    const hash = stateToHash(this.state.user, this.state.trackIds)
    if (hash) window.location.replace(`#${hash}`)
  }

  componentDidMount() {
    const state = hashToState(window.location.hash, this.state.trackIds)
    if (state) {
      this.setState(state)
    } else {
      this.setState({ ...this.state, user: defaultState(this.state.trackIds) })
    }
  }

  render() {
    return (
      <main>
        <link href="https://fonts.googleapis.com/css?family=Muli:200i,400,400i,600,700,800,900|Roboto" rel="stylesheet" />
        <style jsx global>{`
          body {
            font-family: Muli, Roboto, Helvetica;
          }
          main {
            width: 960px;
            margin: 0 auto;
          }
          .name-input {
            border: none;
            display: block;
            border-bottom: 2px solid #fff;
            font-size: 30px;
            line-height: 40px;
            font-weight: bold;
            width: 380px;
            margin-bottom: 10px;
          }
          .name-input:hover, .name-input:focus {
            border-bottom: 2px solid #ccc;
            outline: 0;
          }
          a {
            color: #888;
            text-decoration: none;
          }
        `}</style>
        <div style={{margin: '19px auto 0', width: 142}}>
          <a href="https://soapboxhq.com/" target="_blank">
            <Wordmark />
          </a>
        </div>
        <div style={{display: 'flex'}}>
          <div style={{flex: 1}}>
            <form>
              <div style={{'font-size':'36px'}}>👋</div>
              <input
                  type="text"
                  className="name-input"
                  value={this.state.user.name}
                  onChange={e => this.setState({ user: { ...this.state.user, name: e.target.value} })}
                  placeholder="Name"
                  />
              <TitleSelector
                  milestoneByTrack={this.state.user.milestoneByTrack}
                  currentTitle={this.state.user.title}
                  titles={this.state.titles}
                  trackIds={this.state.trackIds}
                  setTitleFn={(title) => this.setTitle(title)} />
            </form>
            <PointSummaries milestoneByTrack={this.state.user.milestoneByTrack} trackIds={this.state.trackIds} />
            <LevelThermometer milestoneByTrack={this.state.user.milestoneByTrack} trackIds={this.state.trackIds} tracks={this.state.tracks} />
          </div>
          <div style={{flex: 0}}>
            <NightingaleChart
                milestoneByTrack={this.state.user.milestoneByTrack}
                focusedTrackId={this.state.user.focusedTrackId}
                trackIds={this.state.trackIds}
                tracks={this.state.tracks}
                handleTrackMilestoneChangeFn={(track, milestone) => this.handleTrackMilestoneChange(track, milestone)} />
          </div>
        </div>
        <TrackSelector
            milestoneByTrack={this.state.user.milestoneByTrack}
            focusedTrackId={this.state.user.focusedTrackId}
            trackIds={this.state.trackIds}
            tracks={this.state.tracks}
            setFocusedTrackIdFn={this.setFocusedTrackId.bind(this)} />
        <KeyboardListener
            selectNextTrackFn={this.shiftFocusedTrack.bind(this, 1)}
            selectPrevTrackFn={this.shiftFocusedTrack.bind(this, -1)}
            increaseFocusedMilestoneFn={this.shiftFocusedTrackMilestoneByDelta.bind(this, 1)}
            decreaseFocusedMilestoneFn={this.shiftFocusedTrackMilestoneByDelta.bind(this, -1)} />
        <Track
            tracks={this.state.tracks}
            milestoneByTrack={this.state.user.milestoneByTrack}
            trackId={this.state.user.focusedTrackId}
            milestones={this.state.milestones}
            handleTrackMilestoneChangeFn={(track, milestone) => this.handleTrackMilestoneChange(track, milestone)} />
        <div style={{display: 'flex', paddingBottom: '20px'}}>
          <div style={{flex: 5}}>
            ❤️ Made by: <a href="https://medium.engineering" target="_blank">Medium Eng.</a> <br />
            💙 Modified by: <a href="https://soapboxhq.com">Soapbox Eng.</a> <br />
            👩‍🔬 Learn about our Soapbox <a href="https://docs.google.com/document/d/1aGnE9t48aOCwrr_u0U80ArkcVhA9ANuUw0g_ClWzs8c/" target="_blank">growth framework</a>.
          </div>
          <div style={{flex: 1}}>
            <a href="#" onClick={() => this.setState({ ...this.state, user: emptyState(this.state.trackIds) })}>Reset</a>
          </div>
        </div>
      </main>
    )
  }

  handleTrackMilestoneChange(trackId: TrackId, milestone: Milestone) {
    const milestoneByTrack = this.state.user.milestoneByTrack
    milestoneByTrack[trackId] = milestone

    const titles = eligibleTitles(milestoneByTrack, this.state.titles, this.state.trackIds)
    const title = titles.indexOf(this.state.title) === -1 ? titles[0] : this.state.title

    this.setState({ user: { ...this.state.user, milestoneByTrack, focusedTrackId: trackId, title } })
  }

  shiftFocusedTrack(delta: number) {
    const trackIds = this.state.trackIds
    let index = trackIds.indexOf(this.state.user.focusedTrackId)
    index = (index + delta + trackIds.length) % trackIds.length
    const focusedTrackId = this.state.trackIds[index]
    this.setState({ user: { ...this.state.user, focusedTrackId } })
  }

  setFocusedTrackId(trackId: TrackId) {
    let index = this.state.trackIds.indexOf(trackId)
    const focusedTrackId = this.state.trackIds[index]
    this.setState({ user: { ...this.state.user, focusedTrackId } })
  }

  shiftFocusedTrackMilestoneByDelta(delta: number) {
    let prevMilestone = this.state.user.milestoneByTrack[this.state.focusedTrackId]
    let milestone = prevMilestone + delta
    if (milestone < 0) milestone = 0
    if (milestone > 5) milestone = 5
    this.handleTrackMilestoneChange(this.state.focusedTrackId, milestone)
  }

  setTitle(title: string) {
    let titles = eligibleTitles(this.state.user.milestoneByTrack, this.state.trackIds)
    title = titles.indexOf(title) == -1 ? titles[0] : title
    this.setState({ user: { ...this.state.user, title } })
  }
}

export default SnowflakeApp
