import {Pool} from 'pg'
import config from './config/config';

export const pool = new Pool (config.DB)