import useSWR from 'swr';
import FileService from '../api/UserFilesAPI';

const fetchProfileImage = async (userId) => {
  const images = await FileService.getUserImages(userId);
  if (images?.length > 0) {
    return `data:${images[0].type};base64,${images[0].data}`;
  }
  return '/profile-pic.png';
};

const useProfileImage = (userId) => {
  const { data, isLoading } = useSWR(
    userId ? ['profileImage', userId] : null,
    ([, id]) => fetchProfileImage(id),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return { profileImage: data ?? '/profile-pic.png', isLoading };
};

export default useProfileImage;
