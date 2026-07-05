import { Select } from "@funtog/design-system";

const Frame = ({ children }: { children?: any }) => (
  <div className="ft-root" style={{ padding: 20, borderRadius: 12, display: "grid", gap: 14, minWidth: 280 }}>
    {children}
  </div>
);

const modes = [
  { value: "grounded", label: "grounded (with venues)" },
  { value: "shapes", label: "shapes (structure only)" },
];

const budgets = [
  { value: "cheap", label: "cheap and cheerful" },
  { value: "comfortable", label: "comfortable" },
  { value: "splashing", label: "splashing out" },
];

export const Default = () => (
  <Frame>
    <Select label="Mode" options={modes} defaultValue="grounded" />
  </Frame>
);

export const WithHint = () => (
  <Frame>
    <Select label="Budget" options={budgets} defaultValue="comfortable" hint="Sets the price band for every stop" />
  </Frame>
);
