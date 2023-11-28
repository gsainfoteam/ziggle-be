import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.tz.setDefault('Asia/Seoul');
dayjs.extend(utc);
dayjs.extend(timezone);
