import SnowflakeApp from '../components/SnowflakeApp'
import * as constants from '../constants_engineering'


function Home() {
  return (
    <div>
      <SnowflakeApp constants={constants} />
    </div>
  );
}

export default Home;
