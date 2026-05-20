import { GunStatusE, InsStatusE, RadarStatusE } from '@domain/enums/status.enum';
import iconStyles from './statusIcons.module.css';

export function gunIconClass(status: GunStatusE): string {
  switch (status) {
    case GunStatusE.READY:
    case GunStatusE.ARM:
      return iconStyles.gunReady;
    case GunStatusE.WARNING:
      return iconStyles.gunWarning;
    case GunStatusE.FAIL:
      return iconStyles.gunFail;
    case GunStatusE.TRACK:
      return iconStyles.gunTrack;
    case GunStatusE.NO_COMM:
    default:
      return iconStyles.gunNoComm;
  }
}

export function radarIconClass(status: RadarStatusE): string {
  switch (status) {
    case RadarStatusE.OK:
      return iconStyles.radarOk;
    case RadarStatusE.WARNING:
      return iconStyles.radarWarning;
    case RadarStatusE.FAIL:
      return iconStyles.radarFail;
    case RadarStatusE.ACTIVE:
      return iconStyles.radarActive;
    case RadarStatusE.NO_COMM:
    default:
      return iconStyles.radarNoComm;
  }
}

export function insIconClass(status: InsStatusE): string {
  switch (status) {
    case InsStatusE.SURVEY:
      return iconStyles.insSurvey;
    case InsStatusE.ALIGN:
      return iconStyles.insAlign;
    case InsStatusE.FAIL:
      return iconStyles.insFail;
    case InsStatusE.NO_COMM:
    default:
      return iconStyles.insNoComm;
  }
}
