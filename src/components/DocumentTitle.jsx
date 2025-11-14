import { useEffect } from 'react'

function DocumentTitle(title) {

  useEffect(() => {
    document.title = title + ' | ' + "Ra7al Express";
  }, [title]);
}
export default DocumentTitle