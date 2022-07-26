import { definePage } from '../utils/definePage';

type TemplateInfo = {
  name: string;
  file: string;
};

type Props = {
  prefix: string;
  templates: TemplateInfo[];
};

export const Index = (props: Props) => {
  return (
    <ul>
      {props.templates.map(template => (
        <li>
          <a href={`/${ props.prefix }/${ template.file }`}>{template.name}</a>
        </li>
      ))}
    </ul>
  );
};

definePage('index', Index);
