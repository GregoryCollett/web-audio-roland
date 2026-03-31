import type { InstrumentId, VoiceTrigger } from '../types';
import { kick } from './kick';
import { snare } from './snare';
import { clap } from './clap';
import { rimshot } from './rimshot';
import { closedHat } from './closedHat';
import { openHat } from './openHat';
import { lowTom } from './lowTom';
import { midTom } from './midTom';
import { hiTom } from './hiTom';
import { crash } from './crash';
import { ride } from './ride';

export const voices: Record<InstrumentId, VoiceTrigger> = {
  kick,
  snare,
  clap,
  rimshot,
  closedHat,
  openHat: openHat as unknown as VoiceTrigger,
  lowTom,
  midTom,
  hiTom,
  crash,
  ride,
};

export { openHat } from './openHat';
