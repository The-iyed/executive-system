import { DirectivesByTypeTabs } from '@/modules/shared/features/minister-directives';

export const DirectivesFeature = () => {
  return <DirectivesByTypeTabs queryKeyPrefix="uc19-directives" />;
};

export default DirectivesFeature;
