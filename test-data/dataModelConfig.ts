
// default configs
export const defaultConfig = {
  1: {
    name: { status: true, required: true },
    stage_name: { status: true },
    location: { status: true },
    gender: { status: true },
    birth: { status: true, required: true },
    weight: { status: false },
    languages: { status: false }
  },
  2: {
    avatar: { status: true, required: true }
  },
  3: {
    self_rated_skills: { status: true },
    unions: { status: true },
    description: { status: true }
  },
  4: {
    production_types: { status: true, required: true },
    m_CmsQ: { status: false }
  }
};

//full config
export const fullConfig = {
  1: {
    name: { status: true, required: true },
    stage_name: { status: true },
    location: { status: true },
    gender: { status: true },
    birth: { status: true, required: true },
    weight: { status: false },
    languages: { status: false }
  },
  2: {
    avatar: { status: true, required: true }
  },
  3: {
    self_rated_skills: { status: true },
    unions: { status: true },
    description: { status: true }
  },
  4: {
    production_types: { status: true },
    m_CmsQ: { status: false }
  }
}


  //config for API
export const apiConfig = {
    1: {
      name: { status: true, required: true },
      stage_name: { status: true },
      location: { status: true },
      gender: { status: true },
      birth: { status: true, required: true },
      weight: { status: false },
      languages: { status: false }
    },
    2: {
      avatar: { status: false}
    },
    3: {
      self_rated_skills: { status: true },
      unions: { status: true },
      description: { status: true }
    },
    4: {
      production_types: { status: false },
      m_CmsQ: { status: false }
    }
  };
