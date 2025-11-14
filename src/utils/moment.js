import moment from 'moment-timezone';
import 'moment/locale/en-gb';

const DEFAULT_TZ = 'Asia/Muscat';

moment.tz.setDefault(DEFAULT_TZ);

export default moment; 