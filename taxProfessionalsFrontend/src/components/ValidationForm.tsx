import React, { useState } from "react";

interface ValidationFormProps {
  onSuccess: () => void;
}

const ValidationForm: React.FC<ValidationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    tpin: "",
    tcompany: "",
    fullname: "",
    email: "",
    phonenumber: "",
    password: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    bachelor: null as File | null,
    date: "",
    status: "",
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.tpin.trim()) newErrors.tpin = "TPIN is required";
    if (!formData.tcompany.trim()) newErrors.tcompany = "Company name is required";
    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.phonenumber.trim()) newErrors.phonenumber = "Phone number is required";
    else if (!/^\+?\d{8,15}$/.test(formData.phonenumber))
      newErrors.phonenumber = "Phone number is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.sector) newErrors.sector = "Sector is required";
    if (!formData.cell) newErrors.cell = "Cell is required";
    if (!formData.village) newErrors.village = "Village is required";
    if (!formData.bachelor) newErrors.bachelor = "Please upload your Bachelor Degree";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.status) newErrors.status = "Status is required";

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formErrors = validate();
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {[
        { label: "T-PIN", name: "tpin", type: "text" },
        { label: "T-Company", name: "tcompany", type: "text" },
        { label: "Full Name", name: "fullname", type: "text" },
        { label: "Email", name: "email", type: "email" },
        { label: "Phone Number", name: "phonenumber", type: "text" },
        { label: "Password", name: "password", type: "password" },
        { label: "Province", name: "province", type: "text" },
        { label: "District", name: "district", type: "text" },
        { label: "Sector", name: "sector", type: "text" },
        { label: "Cell", name: "cell", type: "text" },
        { label: "Village", name: "village", type: "text" },
        { label: "Date", name: "date", type: "date" },
        { label: "Status", name: "status", type: "text" },
      ].map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            type={field.type}
            name={field.name}
            value={(formData as any)[field.name]}
            onChange={handleChange}
          />
          {errors[field.name] && <p>{errors[field.name]}</p>}
        </div>
      ))}

      {/* Bachelor File Upload */}
      <div>
        <label>Bachelor Degree (Upload)</label>
        <input
          type="file"
          name="bachelor"
          onChange={handleChange}
        />
        {formData.bachelor && <p>Selected file: {(formData.bachelor as File).name}</p>}
        {errors.bachelor && <p>{errors.bachelor}</p>}
      </div>

      <button type="submit">Apply Now</button>
    </form>
  );
};

export default ValidationForm;
