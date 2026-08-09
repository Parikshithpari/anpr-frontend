import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = `PTag — ${title}`;
  }, [title]);
};

export default usePageTitle;